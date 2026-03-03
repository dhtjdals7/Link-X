package com.linkx.service;

import com.linkx.dto.BatchTestRequest;
import com.linkx.dto.BatchTestResponse;
import com.linkx.dto.BatchTestResponse.BatchTestItemResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class BatchTestService {

    private static final Logger log = LoggerFactory.getLogger(BatchTestService.class);

    private final TelegramService telegramService;

    // 진행 상황 추적 (batchId → 현재 진행 건수)
    private final ConcurrentHashMap<String, BatchProgress> progressMap = new ConcurrentHashMap<>();

    public BatchTestService(TelegramService telegramService) {
        this.telegramService = telegramService;
    }

    /**
     * 배치 테스트 실행
     */
    public BatchTestResponse executeBatch(BatchTestRequest request) {
        String batchId = UUID.randomUUID().toString().substring(0, 8);
        String mode = request.getExecutionMode();
        int repeatCount = request.getRepeatCount();

        log.info("[Batch-{}] 배치 테스트 시작 - mode={}, count={}, telegramId={}",
                batchId, mode, repeatCount, request.getTelegramId());

        // 진행 상황 초기화
        BatchProgress progress = new BatchProgress(repeatCount);
        progressMap.put(batchId, progress);

        long batchStartTime = System.currentTimeMillis();
        List<BatchTestItemResult> results;

        try {
            if ("PARALLEL".equalsIgnoreCase(mode)) {
                results = executeParallel(batchId, request, progress);
            } else {
                results = executeSequential(batchId, request, progress);
            }
        } finally {
            // 완료 후 일정 시간 뒤 진행 상황 제거
            CompletableFuture.delayedExecutor(5, TimeUnit.MINUTES).execute(
                    () -> progressMap.remove(batchId)
            );
        }

        long totalElapsed = System.currentTimeMillis() - batchStartTime;

        // 결과 집계
        BatchTestResponse response = buildResponse(batchId, mode, results, totalElapsed);

        log.info("[Batch-{}] 배치 테스트 완료 - 성공={}, 실패={}, 총소요={}ms",
                batchId, response.getSuccessCount(), response.getFailCount(), totalElapsed);

        return response;
    }

    /**
     * 순차 실행
     */
    private List<BatchTestItemResult> executeSequential(
            String batchId, BatchTestRequest request, BatchProgress progress) {

        List<BatchTestItemResult> results = new ArrayList<>();
        int repeatCount = request.getRepeatCount();

        for (int i = 0; i < repeatCount; i++) {
            if (progress.isCancelled()) {
                log.info("[Batch-{}] 배치 중단 요청 - {}건 실행 완료", batchId, i);
                break;
            }

            Map<String, String> fieldValues = resolveFieldValues(request, i);
            BatchTestItemResult result = executeSingle(i + 1, request, fieldValues);
            results.add(result);
            progress.incrementCompleted();

            // 건별 딜레이
            if (request.getDelayMs() > 0 && i < repeatCount - 1) {
                try {
                    Thread.sleep(request.getDelayMs());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        return results;
    }

    /**
     * 병렬 실행
     */
    private List<BatchTestItemResult> executeParallel(
            String batchId, BatchTestRequest request, BatchProgress progress) {

        int threadCount = Math.min(request.getParallelThreads(), 20); // 최대 20 스레드 제한
        if (threadCount <= 0) threadCount = 4; // 기본값

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        List<Future<BatchTestItemResult>> futures = new ArrayList<>();

        for (int i = 0; i < request.getRepeatCount(); i++) {
            final int seq = i + 1;
            final Map<String, String> fieldValues = resolveFieldValues(request, i);

            futures.add(executor.submit(() -> {
                BatchTestItemResult result = executeSingle(seq, request, fieldValues);
                progress.incrementCompleted();
                return result;
            }));
        }

        List<BatchTestItemResult> results = new ArrayList<>();
        for (Future<BatchTestItemResult> future : futures) {
            try {
                results.add(future.get(30, TimeUnit.SECONDS));
            } catch (TimeoutException e) {
                BatchTestItemResult timeout = new BatchTestItemResult();
                timeout.setStatus("TIMEOUT");
                timeout.setErrorMessage("실행 타임아웃 (30초 초과)");
                results.add(timeout);
            } catch (Exception e) {
                BatchTestItemResult error = new BatchTestItemResult();
                error.setStatus("FAIL");
                error.setErrorMessage("실행 오류: " + e.getMessage());
                results.add(error);
            }
        }

        executor.shutdown();
        return results;
    }

    /**
     * 단건 전문 송수신 실행
     */
    private BatchTestItemResult executeSingle(
            int sequence, BatchTestRequest request, Map<String, String> fieldValues) {

        BatchTestItemResult result = new BatchTestItemResult();
        result.setSequence(sequence);

        long startTime = System.currentTimeMillis();

        try {
            // TelegramService의 기존 send 로직 활용
            // 실제 구현에서는 telegramService.send(telegramId, profileId, fieldValues) 호출
            Map<String, Object> sendResult = telegramService.sendTelegram(
                    request.getTelegramId(),
                    request.getProfileId(),
                    fieldValues
            );

            long elapsed = System.currentTimeMillis() - startTime;
            result.setResponseTimeMs(elapsed);
            result.setStatus("SUCCESS");
            result.setRequestRaw((String) sendResult.getOrDefault("requestRaw", ""));
            result.setResponseRaw((String) sendResult.getOrDefault("responseRaw", ""));

            @SuppressWarnings("unchecked")
            Map<String, String> responseFields = (Map<String, String>) sendResult.get("responseFields");
            result.setResponseFields(responseFields);

        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - startTime;
            result.setResponseTimeMs(elapsed);
            result.setStatus("FAIL");
            result.setErrorMessage(e.getMessage());
            log.warn("[Batch] #{} 전송 실패: {}", sequence, e.getMessage());
        }

        return result;
    }

    /**
     * 건별 필드값 결정 (baseFieldValues + itemOverrides 병합)
     */
    private Map<String, String> resolveFieldValues(BatchTestRequest request, int index) {
        Map<String, String> values = new HashMap<>();

        // 기본값 복사
        if (request.getBaseFieldValues() != null) {
            values.putAll(request.getBaseFieldValues());
        }

        // 건별 오버라이드 적용
        if (request.getItemOverrides() != null && index < request.getItemOverrides().size()) {
            Map<String, String> override = request.getItemOverrides().get(index);
            if (override != null) {
                values.putAll(override);
            }
        }

        return values;
    }

    /**
     * 결과 집계
     */
    private BatchTestResponse buildResponse(
            String batchId, String mode, List<BatchTestItemResult> results, long totalElapsed) {

        BatchTestResponse response = new BatchTestResponse();
        response.setBatchId(batchId);
        response.setExecutionMode(mode);
        response.setTotalCount(results.size());
        response.setTotalElapsedMs(totalElapsed);
        response.setResults(results);

        long successCount = results.stream().filter(r -> "SUCCESS".equals(r.getStatus())).count();
        long failCount = results.size() - successCount;
        response.setSuccessCount((int) successCount);
        response.setFailCount((int) failCount);

        // 응답시간 통계
        List<Long> responseTimes = results.stream()
                .filter(r -> r.getResponseTimeMs() > 0)
                .map(BatchTestItemResult::getResponseTimeMs)
                .collect(Collectors.toList());

        if (!responseTimes.isEmpty()) {
            response.setAvgResponseTimeMs(
                    responseTimes.stream().mapToLong(Long::longValue).average().orElse(0));
            response.setMinResponseTimeMs(
                    responseTimes.stream().mapToLong(Long::longValue).min().orElse(0));
            response.setMaxResponseTimeMs(
                    responseTimes.stream().mapToLong(Long::longValue).max().orElse(0));
        }

        return response;
    }

    /**
     * 진행 상황 조회
     */
    public BatchProgress getProgress(String batchId) {
        return progressMap.get(batchId);
    }

    /**
     * 배치 중단
     */
    public void cancelBatch(String batchId) {
        BatchProgress progress = progressMap.get(batchId);
        if (progress != null) {
            progress.cancel();
        }
    }

    /**
     * 배치 진행 상황 클래스
     */
    public static class BatchProgress {
        private final int total;
        private final AtomicInteger completed = new AtomicInteger(0);
        private volatile boolean cancelled = false;

        public BatchProgress(int total) { this.total = total; }

        public int getTotal() { return total; }
        public int getCompleted() { return completed.get(); }
        public boolean isCancelled() { return cancelled; }
        public void cancel() { this.cancelled = true; }
        public void incrementCompleted() { completed.incrementAndGet(); }
        public double getProgressPercent() {
            return total > 0 ? (completed.get() * 100.0 / total) : 0;
        }
    }
}
