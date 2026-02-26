package com.linkx.controller;

import com.linkx.domain.TelegramHistory;
import com.linkx.domain.TelegramLayout;
import com.linkx.protocol.ConnectionConfig;
import com.linkx.service.TelegramService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/telegram")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
public class TelegramController {

    private final TelegramService telegramService;

    // ── 레이아웃 조회 ──

    @GetMapping("/list")
    public ResponseEntity<List<Map<String, String>>> getTelegramList() {
        return ResponseEntity.ok(telegramService.getTelegramList());
    }

    @GetMapping("/layout/{telegramId}")
    public ResponseEntity<List<TelegramLayout>> getLayout(@PathVariable String telegramId) {
        return ResponseEntity.ok(telegramService.getLayout(telegramId));
    }

    @GetMapping("/layout/{telegramId}/section")
    public ResponseEntity<Map<String, List<TelegramLayout>>> getLayoutBySection(
            @PathVariable String telegramId) {
        return ResponseEntity.ok(telegramService.getLayoutBySection(telegramId));
    }

    // ── 전문 빌드/파싱 ──

    @PostMapping("/preview")
    public ResponseEntity<Map<String, Object>> buildPreview(@RequestBody TelegramRequest request) {
        return ResponseEntity.ok(telegramService.buildPreview(
                request.getTelegramId(), request.getFieldValues(), request.getCharset()));
    }

    @PostMapping("/parse")
    public ResponseEntity<Map<String, Object>> parseTelegram(@RequestBody ParseRequest request) {
        return ResponseEntity.ok(telegramService.parseTelegram(
                request.getTelegramId(), request.getRawData(), request.isHex(), request.getCharset()));
    }

    // ── 송수신 ──

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendTelegram(@RequestBody SendRequest request) {
        ConnectionConfig config = ConnectionConfig.builder()
                .protocol(request.getProtocol())
                .host(request.getHost())
                .port(request.getPort())
                .url(request.getUrl())
                .timeoutMs(request.getTimeoutMs())
                .charset(request.getCharset())
                .httpMethod(request.getHttpMethod())
                .contentType(request.getContentType())
                .headers(request.getHeaders())
                .includeLengthHeader(request.isIncludeLengthHeader())
                .lengthHeaderSize(request.getLengthHeaderSize())
                .queueManager(request.getQueueManager())
                .requestQueue(request.getRequestQueue())
                .responseQueue(request.getResponseQueue())
                .build();

        return ResponseEntity.ok(telegramService.sendTelegram(
                request.getTelegramId(), request.getFieldValues(), config, request.getCharset()));
    }

    @PostMapping("/test-connection")
    public ResponseEntity<Map<String, Object>> testConnection(@RequestBody ConnectionTestRequest request) {
        ConnectionConfig config = ConnectionConfig.builder()
                .protocol(request.getProtocol())
                .host(request.getHost())
                .port(request.getPort())
                .url(request.getUrl())
                .build();
        return ResponseEntity.ok(telegramService.testConnection(config));
    }

    // ── 이력 ──

    @GetMapping("/history")
    public ResponseEntity<List<TelegramHistory>> getRecentHistory() {
        return ResponseEntity.ok(telegramService.getRecentHistory());
    }

    @GetMapping("/history/{telegramId}")
    public ResponseEntity<Page<TelegramHistory>> getHistory(
            @PathVariable String telegramId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(telegramService.getHistoryByTelegram(
                telegramId, PageRequest.of(page, size)));
    }

    // ── Request DTOs ──

    @Data
    public static class TelegramRequest {
        private String telegramId;
        private Map<String, String> fieldValues;
        private String charset;
    }

    @Data
    public static class ParseRequest {
        private String telegramId;
        private String rawData;
        private boolean hex;
        private String charset;
    }

    @Data
    public static class SendRequest {
        private String telegramId;
        private Map<String, String> fieldValues;
        private String charset;
        // Connection
        private String protocol;
        private String host;
        private int port;
        private String url;
        private int timeoutMs;
        // HTTP
        private String httpMethod;
        private String contentType;
        private Map<String, String> headers;
        // TCP
        private boolean includeLengthHeader;
        private int lengthHeaderSize;
        // MQ
        private String queueManager;
        private String requestQueue;
        private String responseQueue;
    }

    @Data
    public static class ConnectionTestRequest {
        private String protocol;
        private String host;
        private int port;
        private String url;
    }
}
