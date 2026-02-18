package com.linkx.simulator;

import com.linkx.domain.SimulatorConfig;
import com.linkx.domain.SimulatorLog;
import com.linkx.domain.TelegramLayout;
import com.linkx.repository.SimulatorLogRepository;
import com.linkx.repository.TelegramLayoutRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.nio.charset.Charset;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * TCP 리스너
 *
 * 지정 포트에서 소켓을 열고 전문을 수신 대기
 * 수신 → 길이헤더 파싱 → 전문코드 추출 → 레이아웃 매칭 → 응답 생성 → 리턴
 */
public class TcpListener implements Runnable {

    private static final Logger log = LoggerFactory.getLogger(TcpListener.class);

    private final SimulatorConfig config;
    private final TelegramLayoutRepository layoutRepository;
    private final SimulatorLogRepository logRepository;
    private final ResponseGenerator responseGenerator;

    private ServerSocket serverSocket;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final ExecutorService clientPool = Executors.newCachedThreadPool();

    /** 실시간 로그 콜백 (SSE 등에서 활용) */
    private volatile LogCallback logCallback;

    // === 통계 ===
    private long totalRequests = 0;
    private long successCount = 0;
    private long errorCount = 0;

    public TcpListener(SimulatorConfig config,
                       TelegramLayoutRepository layoutRepository,
                       SimulatorLogRepository logRepository,
                       ResponseGenerator responseGenerator) {
        this.config = config;
        this.layoutRepository = layoutRepository;
        this.logRepository = logRepository;
        this.responseGenerator = responseGenerator;
    }

    @Override
    public void run() {
        try {
            serverSocket = new ServerSocket(config.getPort());
            serverSocket.setSoTimeout(1000); // accept 타임아웃 (shutdown 체크용)
            running.set(true);

            log.info("▶ TCP 리스너 시작 — 포트: {}, 이름: {}", config.getPort(), config.getName());

            while (running.get()) {
                try {
                    Socket clientSocket = serverSocket.accept();
                    clientPool.submit(() -> handleClient(clientSocket));
                } catch (SocketTimeoutException e) {
                    // accept 타임아웃 — running 상태 체크 후 계속
                }
            }
        } catch (Exception e) {
            if (running.get()) {
                log.error("TCP 리스너 에러 (포트: {}): {}", config.getPort(), e.getMessage());
            }
        } finally {
            stop();
        }
    }

    /**
     * 클라이언트 연결 처리
     */
    private void handleClient(Socket clientSocket) {
        long startTime = System.currentTimeMillis();
        SimulatorLog simLog = new SimulatorLog();
        simLog.setConfigId(config.getId());
        simLog.setClientIp(clientSocket.getInetAddress().getHostAddress());
        simLog.setClientPort(clientSocket.getPort());
        simLog.setReceivedAt(LocalDateTime.now());

        try (InputStream in = clientSocket.getInputStream();
             OutputStream out = clientSocket.getOutputStream()) {

            clientSocket.setSoTimeout(10000); // 읽기 타임아웃 10초

            Charset charset = Charset.forName(config.getEncoding());

            // 1. 길이 헤더 읽기
            int lengthHeaderSize = config.getLengthHeaderSize();
            int bodyLength;

            if (lengthHeaderSize > 0) {
                byte[] lengthHeader = readExact(in, lengthHeaderSize);
                String lengthStr = new String(lengthHeader, charset).trim();
                bodyLength = Integer.parseInt(lengthStr);

                if (config.isLengthIncludesHeader()) {
                    bodyLength -= lengthHeaderSize;
                }
            } else {
                // 길이 헤더 없음 — 최대 버퍼로 읽기
                bodyLength = 8192;
            }

            // 2. 전문 본문 읽기
            byte[] bodyBytes = readExact(in, bodyLength);
            String requestRaw = new String(bodyBytes, charset);
            simLog.setRequestRaw(requestRaw);

            log.debug("수신 전문 [{}bytes]: {}", bodyBytes.length, requestRaw);

            // 3. 전문코드 추출
            int idOffset = config.getTelegramIdOffset();
            int idLength = config.getTelegramIdLength();
            String telegramId = "";

            if (idOffset + idLength <= bodyBytes.length) {
                byte[] idBytes = Arrays.copyOfRange(bodyBytes, idOffset, idOffset + idLength);
                telegramId = new String(idBytes, charset).trim();
            }
            simLog.setTelegramId(telegramId);

            log.info("◆ 수신 — 전문코드: [{}], 클라이언트: {}:{}", telegramId,
                    clientSocket.getInetAddress().getHostAddress(), clientSocket.getPort());

            // 4. 레이아웃 조회 & 파싱
            List<TelegramLayout> layouts = layoutRepository.findByTelegramIdOrderByFieldOrderAsc(telegramId);

            if (layouts.isEmpty()) {
                simLog.setStatus("NO_LAYOUT");
                simLog.setErrorMessage("전문코드 [" + telegramId + "] 레이아웃 없음");
                log.warn("레이아웃 없음: {}", telegramId);
                totalRequests++;
                errorCount++;
                return;
            }

            // 수신 전문 파싱 (필드별 분해)
            Map<String, String> requestFields = parseTelegram(bodyBytes, layouts, charset);

            // 5. 응답 지연 시뮬레이션
            if (config.getResponseDelayMs() > 0) {
                Thread.sleep(config.getResponseDelayMs());
            }

            // 6. 응답 전문 생성
            Map<String, String> responseFields = responseGenerator.generateResponseFields(telegramId, requestFields);

            // 7. 응답 전문 빌드 (고정길이)
            byte[] responseBody = buildTelegram(responseFields, layouts, charset);
            String responseRaw = new String(responseBody, charset);
            simLog.setResponseRaw(responseRaw);

            // 8. 길이 헤더 + 응답 전송
            if (lengthHeaderSize > 0) {
                int respLength = config.isLengthIncludesHeader()
                        ? responseBody.length + lengthHeaderSize
                        : responseBody.length;
                String lengthStr = String.format("%" + lengthHeaderSize + "d", respLength);
                out.write(lengthStr.getBytes(charset));
            }
            out.write(responseBody);
            out.flush();

            simLog.setStatus("SUCCESS");
            totalRequests++;
            successCount++;

            log.info("◆ 응답 — 전문코드: [{}], 길이: {}bytes", telegramId, responseBody.length);

        } catch (Exception e) {
            simLog.setStatus("ERROR");
            simLog.setErrorMessage(e.getMessage());
            totalRequests++;
            errorCount++;
            log.error("클라이언트 처리 에러: {}", e.getMessage());
        } finally {
            simLog.setProcessTimeMs(System.currentTimeMillis() - startTime);

            // DB 로그 저장
            try {
                logRepository.save(simLog);
            } catch (Exception e) {
                log.error("로그 저장 실패: {}", e.getMessage());
            }

            // 콜백 호출 (실시간 로그)
            if (logCallback != null) {
                logCallback.onLog(simLog);
            }

            try {
                clientSocket.close();
            } catch (Exception ignored) {}
        }
    }

    /**
     * 전문 파싱 — 바이트 배열을 레이아웃 기준으로 필드별 분해
     */
    private Map<String, String> parseTelegram(byte[] data, List<TelegramLayout> layouts, Charset charset) {
        Map<String, String> fields = new LinkedHashMap<>();
        int offset = 0;

        for (TelegramLayout layout : layouts) {
            int fieldLen = layout.getFieldLength();
            if (offset + fieldLen > data.length) break;

            byte[] fieldBytes = Arrays.copyOfRange(data, offset, offset + fieldLen);
            String value = new String(fieldBytes, charset);

            // 타입에 따라 trim 처리
            if ("N".equals(layout.getDataType())) {
                value = value.trim(); // 숫자는 앞뒤 공백/0 제거
            } else {
                value = value.stripTrailing(); // 문자는 뒤쪽 공백만 제거
            }

            fields.put(layout.getFieldName(), value);
            offset += fieldLen;
        }

        return fields;
    }

    /**
     * 전문 빌드 — 필드값 맵을 고정길이 바이트 배열로 변환
     */
    private byte[] buildTelegram(Map<String, String> fields, List<TelegramLayout> layouts, Charset charset) {
        // 전체 길이 계산
        int totalLength = layouts.stream().mapToInt(TelegramLayout::getFieldLength).sum();
        byte[] result = new byte[totalLength];

        // 기본 패딩 (스페이스)
        Arrays.fill(result, (byte) 0x20);

        int offset = 0;
        for (TelegramLayout layout : layouts) {
            int fieldLen = layout.getFieldLength();
            String value = fields.getOrDefault(layout.getFieldName(), "");

            byte[] valueBytes = value.getBytes(charset);

            if ("N".equals(layout.getDataType())) {
                // 숫자: 우측 정렬, 좌측 0 패딩
                byte[] padded = new byte[fieldLen];
                Arrays.fill(padded, (byte) '0');
                int copyStart = Math.max(0, fieldLen - valueBytes.length);
                int copyLen = Math.min(valueBytes.length, fieldLen);
                System.arraycopy(valueBytes, 0, padded, copyStart, copyLen);
                System.arraycopy(padded, 0, result, offset, fieldLen);
            } else {
                // 문자: 좌측 정렬, 우측 스페이스 패딩
                int copyLen = Math.min(valueBytes.length, fieldLen);
                System.arraycopy(valueBytes, 0, result, offset, copyLen);
            }

            offset += fieldLen;
        }

        return result;
    }

    /**
     * 지정 바이트 수만큼 정확하게 읽기
     */
    private byte[] readExact(InputStream in, int length) throws Exception {
        byte[] buffer = new byte[length];
        int totalRead = 0;
        while (totalRead < length) {
            int read = in.read(buffer, totalRead, length - totalRead);
            if (read == -1) {
                throw new RuntimeException("스트림 종료 (읽은 바이트: " + totalRead + "/" + length + ")");
            }
            totalRead += read;
        }
        return buffer;
    }

    // === 제어 메서드 ===

    public void stop() {
        running.set(false);
        try {
            if (serverSocket != null && !serverSocket.isClosed()) {
                serverSocket.close();
            }
        } catch (Exception ignored) {}
        clientPool.shutdownNow();
        log.info("■ TCP 리스너 중지 — 포트: {}", config.getPort());
    }

    public boolean isRunning() {
        return running.get();
    }

    public SimulatorConfig getConfig() {
        return config;
    }

    public void setLogCallback(LogCallback callback) {
        this.logCallback = callback;
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("port", config.getPort());
        stats.put("name", config.getName());
        stats.put("running", running.get());
        stats.put("totalRequests", totalRequests);
        stats.put("successCount", successCount);
        stats.put("errorCount", errorCount);
        return stats;
    }

    // === 콜백 인터페이스 ===
    @FunctionalInterface
    public interface LogCallback {
        void onLog(SimulatorLog log);
    }
}
