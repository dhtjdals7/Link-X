package com.linkx.service;

import com.linkx.domain.ConnectionProfile;
import com.linkx.dto.BatchTestRequest;
import com.linkx.dto.BatchTestResponse;
import com.linkx.dto.BatchTestResponse.BatchTestItemResult;
import com.linkx.protocol.ConnectionConfig;
import com.linkx.repository.ConnectionProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BatchTestService {

    private final TelegramService telegramService;
    private final ConnectionProfileRepository profileRepository;

    private final ConcurrentHashMap<String, BatchProgress> progressMap = new ConcurrentHashMap<>();

    public BatchTestResponse executeBatch(BatchTestRequest request) {
        String batchId = UUID.randomUUID().toString().substring(0, 8);
        String mode = request.getExecutionMode();
        int repeatCount = request.getRepeatCount();

        log.info("[Batch-{}] 시작 - mode={}, count={}, telegramId={}",
                batchId, mode, repeatCount, request.getTelegramId());

        ConnectionConfig connConfig = resolveConnectionConfig(request.getProfileId());
        String charset = connConfig.getCharset() != null ? connConfig.getCharset() : "EUC-KR";

        BatchProgress progress = new BatchProgress(repeatCount);
        progressMap.put(batchId, progress);

        long batchStartTime = System.currentTimeMillis();
        List<BatchTestItemResult> results;

        try {
            if ("PARALLEL".equalsIgnoreCase(mode)) {
                results = executeParallel(batchId, request, connConfig, charset, progress);
            } else {
                results = executeSequential(batchId, request, connConfig, charset, progress);
            }
        } finally {
            CompletableFuture.delayedExecutor(5, TimeUnit.MINUTES)
                    .execute(() -> progressMap.remove(batchId));
        }

        long totalElapsed = System.currentTimeMillis() - batchStartTime;
        BatchTestResponse response = buildResponse(batchId, mode, results, totalElapsed);

        log.info("[Batch-{}] 완료 - 성공={}, 실패={}, 소요={}ms",
                batchId, response.getSuccessCount(), response.getFailCount(), totalElapsed);

        return response;
    }

    private ConnectionConfig resolveConnectionConfig(String profileId) {
        ConnectionProfile profile = profileRepository.findById(Long.parseLong(profileId))
                .orElseThrow(() -> new RuntimeException("프로파일 없음: " + profileId));

        return ConnectionConfig.builder()
                .protocol(profile.getProtocol())
                .host(profile.getHost())
                .port(profile.getPort() != null ? profile.getPort() : 0)
                .url(profile.getUrl())
                .charset(profile.getCharset())
                .timeoutMs(profile.getTimeoutMs() != null ? profile.getTimeoutMs() : 30000)
                .includeLengthHeader(profile.getIncludeLengthHeader() != null ? profile.getIncludeLengthHeader() : true)
                .lengthHeaderSize(profile.getLengthHeaderSize() != null ? profile.getLengthHeaderSize() : 4)
                .build();
    }

    private List<BatchTestItemResult> executeSequential(
            String batchId, BatchTestRequest request,
            ConnectionConfig connConfig, String charset, BatchProgress progress) {

        List<BatchTestItemResult> results = new ArrayList<>();
        for (int i = 0; i < request.getRepeatCount(); i++) {
            if (progress.isCancelled()) {
                log.info("[Batch-{}] 중단 - {}건 완료", batchId, i);
                break;
            }
            Map<String, String> fieldValues = resolveFieldValues(request, i);
            results.add(executeSingle(i + 1, request.getTelegramId(), fieldValues, connConfig, charset));
            progress.incrementCompleted();

            if (request.getDelayMs() > 0 && i < request.getRepeatCount() - 1) {
                try { Thread.sleep(request.getDelayMs()); }
                catch (InterruptedException e) { Thread.currentThread().interrupt(); break; }
            }
        }
        return results;
    }

    private List<BatchTestItemResult> executeParallel(
            String batchId, BatchTestRequest request,
            ConnectionConfig connConfig, String charset, BatchProgress progress) {

        int threadCount = Math.max(1, Math.min(request.getParallelThreads(), 20));
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        List<Future<BatchTestItemResult>> futures = new ArrayList<>();

        for (int i = 0; i < request.getRepeatCount(); i++) {
            final int seq = i + 1;
            final Map<String, String> fv = resolveFieldValues(request, i);
            futures.add(executor.submit(() -> {
                BatchTestItemResult r = executeSingle(seq, request.getTelegramId(), fv, connConfig, charset);
                progress.incrementCompleted();
                return r;
            }));
        }

        List<BatchTestItemResult> results = new ArrayList<>();
        for (Future<BatchTestItemResult> f : futures) {
            try {
                results.add(f.get(30, TimeUnit.SECONDS));
            } catch (TimeoutException e) {
                BatchTestItemResult t = new BatchTestItemResult();
                t.setStatus("TIMEOUT"); t.setErrorMessage("타임아웃 (30s)");
                results.add(t);
            } catch (Exception e) {
                BatchTestItemResult er = new BatchTestItemResult();
                er.setStatus("FAIL"); er.setErrorMessage(e.getMessage());
                results.add(er);
            }
        }
        executor.shutdown();
        return results;
    }

    private BatchTestItemResult executeSingle(int sequence, String telegramId,
                                              Map<String, String> fieldValues, ConnectionConfig connConfig, String charset) {

        BatchTestItemResult result = new BatchTestItemResult();
        result.setSequence(sequence);

        try {
            Map<String, Object> sendResult = telegramService.sendTelegram(
                    telegramId, fieldValues, connConfig, charset);

            result.setResponseTimeMs(sendResult.containsKey("elapsedMs")
                    ? ((Number) sendResult.get("elapsedMs")).longValue() : 0);

            boolean success = Boolean.TRUE.equals(sendResult.get("success"));
            result.setStatus(success ? "SUCCESS" : "FAIL");

            if (sendResult.get("request") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> req = (Map<String, Object>) sendResult.get("request");
                result.setRequestRaw((String) req.getOrDefault("rawText", ""));
            }
            if (sendResult.get("response") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> res = (Map<String, Object>) sendResult.get("response");
                result.setResponseRaw((String) res.getOrDefault("rawText", ""));
            }
            if (!success) {
                result.setErrorMessage((String) sendResult.getOrDefault("error", "알 수 없는 오류"));
            }
        } catch (Exception e) {
            result.setStatus("FAIL");
            result.setErrorMessage(e.getMessage());
            log.warn("[Batch] #{} 실패: {}", sequence, e.getMessage());
        }
        return result;
    }

    private Map<String, String> resolveFieldValues(BatchTestRequest request, int index) {
        Map<String, String> values = new HashMap<>();
        if (request.getBaseFieldValues() != null) values.putAll(request.getBaseFieldValues());
        if (request.getItemOverrides() != null && index < request.getItemOverrides().size()) {
            Map<String, String> ov = request.getItemOverrides().get(index);
            if (ov != null) values.putAll(ov);
        }
        return values;
    }

    private BatchTestResponse buildResponse(String batchId, String mode,
                                            List<BatchTestItemResult> results, long totalElapsed) {

        BatchTestResponse resp = new BatchTestResponse();
        resp.setBatchId(batchId);
        resp.setExecutionMode(mode);
        resp.setTotalCount(results.size());
        resp.setTotalElapsedMs(totalElapsed);
        resp.setResults(results);

        long ok = results.stream().filter(r -> "SUCCESS".equals(r.getStatus())).count();
        resp.setSuccessCount((int) ok);
        resp.setFailCount(results.size() - (int) ok);

        List<Long> times = results.stream()
                .filter(r -> r.getResponseTimeMs() > 0)
                .map(BatchTestItemResult::getResponseTimeMs)
                .collect(Collectors.toList());
        if (!times.isEmpty()) {
            resp.setAvgResponseTimeMs(times.stream().mapToLong(Long::longValue).average().orElse(0));
            resp.setMinResponseTimeMs(times.stream().mapToLong(Long::longValue).min().orElse(0));
            resp.setMaxResponseTimeMs(times.stream().mapToLong(Long::longValue).max().orElse(0));
        }
        return resp;
    }

    public BatchProgress getProgress(String batchId) { return progressMap.get(batchId); }

    public void cancelBatch(String batchId) {
        BatchProgress p = progressMap.get(batchId);
        if (p != null) p.cancel();
    }

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
        public double getProgressPercent() { return total > 0 ? (completed.get() * 100.0 / total) : 0; }
    }
}