package com.linkx.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.linkx.domain.TelegramHistory;
import com.linkx.domain.TelegramLayout;
import com.linkx.protocol.ConnectionConfig;
import com.linkx.protocol.ProtocolRouter;
import com.linkx.repository.TelegramHistoryRepository;
import com.linkx.repository.TelegramLayoutRepository;
import com.linkx.telegram.TelegramEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramService {

    private final TelegramLayoutRepository layoutRepository;
    private final TelegramHistoryRepository historyRepository;
    private final TelegramEngine telegramEngine;
    private final ProtocolRouter protocolRouter;
    private final ObjectMapper objectMapper;

    /**
     * 전문코드 목록 조회
     */
    public List<Map<String, String>> getTelegramList() {
        List<Object[]> rows = layoutRepository.findDistinctTelegrams();
        List<Map<String, String>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, String> map = new LinkedHashMap<>();
            map.put("telegramId", (String) row[0]);
            map.put("telegramName", (String) row[1]);
            result.add(map);
        }
        return result;
    }

    /**
     * 전문 레이아웃 조회
     */
    public List<TelegramLayout> getLayout(String telegramId) {
        return layoutRepository.findByTelegramIdAndActiveTrueOrderByFieldSeq(telegramId);
    }

    /**
     * 전문 레이아웃 조회 (섹션별)
     */
    public Map<String, List<TelegramLayout>> getLayoutBySection(String telegramId) {
        Map<String, List<TelegramLayout>> result = new LinkedHashMap<>();
        result.put("HEADER", layoutRepository.findByTelegramIdAndSectionAndActiveTrueOrderByFieldSeq(
                telegramId, "HEADER"));
        result.put("BODY", layoutRepository.findByTelegramIdAndSectionAndActiveTrueOrderByFieldSeq(
                telegramId, "BODY"));
        return result;
    }

    /**
     * 전문 조립 미리보기 (실제 전송 X)
     */
    public Map<String, Object> buildPreview(String telegramId, Map<String, String> fieldValues, String charset) {
        List<TelegramLayout> layouts = getLayout(telegramId);

        // 유효성 검사
        List<String> errors = telegramEngine.validate(layouts, fieldValues);
        if (!errors.isEmpty()) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", false);
            result.put("errors", errors);
            return result;
        }

        byte[] rawData = telegramEngine.build(layouts, fieldValues, charset);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("rawHex", telegramEngine.toHexDump(rawData));
        result.put("rawText", new String(rawData, java.nio.charset.Charset.forName(
                charset != null ? charset : "EUC-KR")));
        result.put("totalLength", rawData.length);
        result.put("fieldCount", layouts.size());
        return result;
    }

    /**
     * 전문 송수신 실행
     */
    @Transactional
    public Map<String, Object> sendTelegram(String telegramId, Map<String, String> fieldValues,
                                             ConnectionConfig connConfig, String charset) {
        List<TelegramLayout> layouts = getLayout(telegramId);
        long startTime = System.currentTimeMillis();

        // 유효성 검사
        List<String> errors = telegramEngine.validate(layouts, fieldValues);
        if (!errors.isEmpty()) {
            return Map.of("success", false, "errors", errors);
        }

        // 전문 조립
        byte[] requestData = telegramEngine.build(layouts, fieldValues, charset);

        TelegramHistory history = TelegramHistory.builder()
                .telegramId(telegramId)
                .protocol(connConfig.getProtocol())
                .direction("SEND")
                .target(formatTarget(connConfig))
                .rawRequest(telegramEngine.toHexDump(requestData))
                .build();

        try {
            // 파싱된 요청 저장
            history.setParsedRequest(objectMapper.writeValueAsString(fieldValues));

            // 송수신 실행
            byte[] responseData = protocolRouter.sendAndReceive(connConfig, requestData);
            long elapsed = System.currentTimeMillis() - startTime;

            // 응답 파싱
            Map<String, Object> parsedResponse = telegramEngine.parse(responseData, layouts, charset);

            history.setRawResponse(telegramEngine.toHexDump(responseData));
            history.setParsedResponse(objectMapper.writeValueAsString(parsedResponse));
            history.setElapsedMs(elapsed);
            history.setSuccess(true);

            historyRepository.save(history);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("elapsedMs", elapsed);
            result.put("request", Map.of(
                    "rawHex", telegramEngine.toHexDump(requestData),
                    "rawText", new String(requestData, java.nio.charset.Charset.forName(
                            charset != null ? charset : "EUC-KR")),
                    "fields", fieldValues
            ));
            result.put("response", parsedResponse);
            result.put("historyId", history.getId());
            return result;

        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - startTime;
            log.error("[TelegramService] 전문 송수신 실패: {}", e.getMessage(), e);

            history.setElapsedMs(elapsed);
            history.setSuccess(false);
            history.setErrorMessage(e.getMessage());
            historyRepository.save(history);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", false);
            result.put("elapsedMs", elapsed);
            result.put("error", e.getMessage());
            result.put("historyId", history.getId());
            return result;
        }
    }

    /**
     * 수신 전문 파싱
     */
    public Map<String, Object> parseTelegram(String telegramId, String rawHexOrText,
                                              boolean isHex, String charset) {
        List<TelegramLayout> layouts = getLayout(telegramId);
        byte[] rawData;

        if (isHex) {
            rawData = hexStringToBytes(rawHexOrText);
        } else {
            rawData = rawHexOrText.getBytes(java.nio.charset.Charset.forName(
                    charset != null ? charset : "EUC-KR"));
        }

        return telegramEngine.parse(rawData, layouts, charset);
    }

    /**
     * 이력 조회
     */
    public List<TelegramHistory> getRecentHistory() {
        return historyRepository.findTop20ByOrderByCreatedAtDesc();
    }

    public Page<TelegramHistory> getHistoryByTelegram(String telegramId, Pageable pageable) {
        return historyRepository.findByTelegramIdOrderByCreatedAtDesc(telegramId, pageable);
    }

    /**
     * 연결 테스트
     */
    public Map<String, Object> testConnection(ConnectionConfig config) {
        long start = System.currentTimeMillis();
        boolean connected = protocolRouter.testConnection(config);
        long elapsed = System.currentTimeMillis() - start;

        return Map.of(
                "connected", connected,
                "protocol", config.getProtocol(),
                "target", formatTarget(config),
                "elapsedMs", elapsed
        );
    }

    // ── Helpers ──

    private String formatTarget(ConnectionConfig config) {
        if (config.getUrl() != null && !config.getUrl().isEmpty()) {
            return config.getUrl();
        }
        return config.getHost() + ":" + config.getPort();
    }

    private byte[] hexStringToBytes(String hex) {
        hex = hex.replaceAll("\\s+", "");
        byte[] bytes = new byte[hex.length() / 2];
        for (int i = 0; i < bytes.length; i++) {
            bytes[i] = (byte) Integer.parseInt(hex.substring(i * 2, i * 2 + 2), 16);
        }
        return bytes;
    }
}
