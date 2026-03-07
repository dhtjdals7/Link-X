package com.linkx.simulator;

import com.linkx.domain.SimulatorLog;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * SSE Emitter 관리자
 *
 * - 클라이언트 SSE 연결 관리
 * - TcpListener의 LogCallback으로 등록되어 전문 수신 시 실시간 푸시
 * - TPS, 응답시간 등 실시간 통계 집계
 */
@Slf4j
@Component
public class SseEmitterManager implements TcpListener.LogCallback {

    private static final long SSE_TIMEOUT = 5 * 60 * 1000L; // 5분

    /** 활성 SSE 연결 */
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /** 실시간 통계 — 슬라이딩 윈도우 (최근 60초) */
    private final ConcurrentLinkedDeque<LogEntry> recentLogs = new ConcurrentLinkedDeque<>();

    /** 전체 누적 통계 */
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong totalSuccess = new AtomicLong(0);
    private final AtomicLong totalErrors = new AtomicLong(0);
    private final AtomicLong totalResponseTimeMs = new AtomicLong(0);

    /** TPS 계산용 — 초별 카운트 (최근 60초) */
    private final ConcurrentHashMap<Long, AtomicLong> tpsWindow = new ConcurrentHashMap<>();

    /** 응답시간 분포 (구간별 카운트) */
    private final AtomicLong rt0_50 = new AtomicLong(0);
    private final AtomicLong rt50_100 = new AtomicLong(0);
    private final AtomicLong rt100_200 = new AtomicLong(0);
    private final AtomicLong rt200_500 = new AtomicLong(0);
    private final AtomicLong rt500plus = new AtomicLong(0);

    /** 전문코드별 카운트 */
    private final ConcurrentHashMap<String, AtomicLong> telegramIdCounts = new ConcurrentHashMap<>();

    /** 프로토콜별 카운트 (현재 TCP만) */
    private final ConcurrentHashMap<String, AtomicLong> protocolCounts = new ConcurrentHashMap<>();

    /** 최근 로그 버퍼 (최신 100건) */
    private final ConcurrentLinkedDeque<Map<String, Object>> recentLogBuffer = new ConcurrentLinkedDeque<>();
    private static final int MAX_RECENT_LOGS = 100;

    private final ScheduledExecutorService cleanupScheduler = Executors.newSingleThreadScheduledExecutor();

    public SseEmitterManager() {
        // 오래된 TPS 윈도우 데이터 정리 (10초마다)
        cleanupScheduler.scheduleAtFixedRate(this::cleanupOldTpsData, 10, 10, TimeUnit.SECONDS);
    }

    // ==================== SSE 연결 관리 ====================

    /**
     * 새 SSE 연결 생성
     */
    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            log.debug("SSE 연결 종료 (현재 연결 수: {})", emitters.size());
        });
        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            log.debug("SSE 타임아웃 (현재 연결 수: {})", emitters.size());
        });
        emitter.onError(e -> {
            emitters.remove(emitter);
            log.debug("SSE 에러: {}", e.getMessage());
        });

        emitters.add(emitter);
        log.info("SSE 연결 생성 (현재 연결 수: {})", emitters.size());

        // 초기 데이터 전송 (현재 통계 스냅샷)
        try {
            emitter.send(SseEmitter.event()
                    .name("init")
                    .data(getStatsSnapshot()));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    // ==================== LogCallback 구현 ====================

    @Override
    public void onLog(SimulatorLog simLog) {
        // 1. 통계 업데이트
        updateStats(simLog);

        // 2. 로그 이벤트 생성
        Map<String, Object> event = buildLogEvent(simLog);

        // 3. 최근 로그 버퍼에 추가
        recentLogBuffer.addFirst(event);
        while (recentLogBuffer.size() > MAX_RECENT_LOGS) {
            recentLogBuffer.removeLast();
        }

        // 4. 모든 SSE 클라이언트에 푸시
        broadcastEvent("log", event);

        // 5. 통계 스냅샷 푸시 (매 요청마다)
        broadcastEvent("stats", getStatsSnapshot());
    }

    // ==================== 통계 관리 ====================

    private void updateStats(SimulatorLog simLog) {
        totalRequests.incrementAndGet();

        boolean success = "SUCCESS".equals(simLog.getStatus());
        if (success) {
            totalSuccess.incrementAndGet();
        } else {
            totalErrors.incrementAndGet();
        }

        long responseTime = simLog.getProcessTimeMs();
        totalResponseTimeMs.addAndGet(responseTime);

        // TPS 윈도우
        long secondKey = System.currentTimeMillis() / 1000;
        tpsWindow.computeIfAbsent(secondKey, k -> new AtomicLong(0)).incrementAndGet();

        // 응답시간 분포
        if (responseTime <= 50) rt0_50.incrementAndGet();
        else if (responseTime <= 100) rt50_100.incrementAndGet();
        else if (responseTime <= 200) rt100_200.incrementAndGet();
        else if (responseTime <= 500) rt200_500.incrementAndGet();
        else rt500plus.incrementAndGet();

        // 전문코드별 카운트
        String telegramId = simLog.getTelegramId() != null ? simLog.getTelegramId() : "UNKNOWN";
        telegramIdCounts.computeIfAbsent(telegramId, k -> new AtomicLong(0)).incrementAndGet();

        // 프로토콜 카운트
        protocolCounts.computeIfAbsent("TCP", k -> new AtomicLong(0)).incrementAndGet();

        // 슬라이딩 윈도우
        recentLogs.addFirst(new LogEntry(System.currentTimeMillis(), responseTime, success));
        while (recentLogs.size() > 1000) {
            recentLogs.removeLast();
        }
    }

    /**
     * 현재 통계 스냅샷
     */
    public Map<String, Object> getStatsSnapshot() {
        Map<String, Object> stats = new LinkedHashMap<>();

        long total = totalRequests.get();
        long success = totalSuccess.get();
        long errors = totalErrors.get();

        stats.put("totalRequests", total);
        stats.put("successCount", success);
        stats.put("errorCount", errors);
        stats.put("successRate", total > 0 ? Math.round((success * 1000.0 / total)) / 10.0 : 0);

        // 평균 응답시간
        long avgMs = total > 0 ? totalResponseTimeMs.get() / total : 0;
        stats.put("avgResponseTimeMs", avgMs);

        // 현재 TPS (최근 5초 평균)
        stats.put("currentTps", calculateCurrentTps());

        // TPS 히스토리 (최근 60초, 초별)
        stats.put("tpsHistory", getTpsHistory());

        // 응답시간 분포
        Map<String, Long> rtDist = new LinkedHashMap<>();
        rtDist.put("0-50ms", rt0_50.get());
        rtDist.put("50-100ms", rt50_100.get());
        rtDist.put("100-200ms", rt100_200.get());
        rtDist.put("200-500ms", rt200_500.get());
        rtDist.put("500ms+", rt500plus.get());
        stats.put("responseTimeDistribution", rtDist);

        // 전문코드별 분포
        Map<String, Long> telegramDist = new LinkedHashMap<>();
        telegramIdCounts.forEach((k, v) -> telegramDist.put(k, v.get()));
        stats.put("telegramDistribution", telegramDist);

        // 프로토콜 분포
        Map<String, Long> protoDist = new LinkedHashMap<>();
        protocolCounts.forEach((k, v) -> protoDist.put(k, v.get()));
        stats.put("protocolDistribution", protoDist);

        // 최근 응답시간 추이 (최근 30건)
        List<Long> recentResponseTimes = new ArrayList<>();
        int count = 0;
        for (LogEntry entry : recentLogs) {
            if (count++ >= 30) break;
            recentResponseTimes.add(entry.responseTimeMs);
        }
        stats.put("recentResponseTimes", recentResponseTimes);

        stats.put("activeConnections", emitters.size());
        stats.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        return stats;
    }

    /**
     * 최근 로그 목록 (초기 로드용)
     */
    public List<Map<String, Object>> getRecentLogs() {
        return new ArrayList<>(recentLogBuffer);
    }

    // ==================== 내부 메서드 ====================

    private Map<String, Object> buildLogEvent(SimulatorLog simLog) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("id", simLog.getId());
        event.put("telegramId", simLog.getTelegramId());
        event.put("status", simLog.getStatus());
        event.put("clientIp", simLog.getClientIp());
        event.put("clientPort", simLog.getClientPort());
        event.put("processTimeMs", simLog.getProcessTimeMs());
        event.put("requestRaw", truncate(simLog.getRequestRaw(), 200));
        event.put("responseRaw", truncate(simLog.getResponseRaw(), 200));
        event.put("errorMessage", simLog.getErrorMessage());
        event.put("receivedAt", simLog.getReceivedAt() != null
                ? simLog.getReceivedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
        event.put("protocol", "TCP");
        return event;
    }

    private double calculateCurrentTps() {
        long now = System.currentTimeMillis() / 1000;
        long total = 0;
        for (long sec = now - 5; sec < now; sec++) {
            AtomicLong count = tpsWindow.get(sec);
            if (count != null) total += count.get();
        }
        return Math.round(total / 5.0 * 10) / 10.0;
    }

    private List<Map<String, Object>> getTpsHistory() {
        long now = System.currentTimeMillis() / 1000;
        List<Map<String, Object>> history = new ArrayList<>();
        for (long sec = now - 60; sec < now; sec++) {
            AtomicLong count = tpsWindow.get(sec);
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("second", sec - (now - 60));
            point.put("count", count != null ? count.get() : 0);
            history.add(point);
        }
        return history;
    }

    private void cleanupOldTpsData() {
        long cutoff = System.currentTimeMillis() / 1000 - 120;
        tpsWindow.entrySet().removeIf(entry -> entry.getKey() < cutoff);
    }

    private void broadcastEvent(String eventName, Object data) {
        List<SseEmitter> deadEmitters = new ArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }

        emitters.removeAll(deadEmitters);
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return null;
        return s.length() > maxLen ? s.substring(0, maxLen) + "..." : s;
    }

    /**
     * 통계 리셋
     */
    public void resetStats() {
        totalRequests.set(0);
        totalSuccess.set(0);
        totalErrors.set(0);
        totalResponseTimeMs.set(0);
        rt0_50.set(0);
        rt50_100.set(0);
        rt100_200.set(0);
        rt200_500.set(0);
        rt500plus.set(0);
        tpsWindow.clear();
        telegramIdCounts.clear();
        protocolCounts.clear();
        recentLogs.clear();
        recentLogBuffer.clear();
    }

    // === 내부 클래스 ===

    private static class LogEntry {
        final long timestamp;
        final long responseTimeMs;
        final boolean success;

        LogEntry(long timestamp, long responseTimeMs, boolean success) {
            this.timestamp = timestamp;
            this.responseTimeMs = responseTimeMs;
            this.success = success;
        }
    }
}
