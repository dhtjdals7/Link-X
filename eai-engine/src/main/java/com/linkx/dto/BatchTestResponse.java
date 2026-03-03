package com.linkx.dto;

import java.util.List;

public class BatchTestResponse {

    private String batchId;                       // 배치 실행 ID
    private String executionMode;                 // SEQUENTIAL | PARALLEL
    private int totalCount;                       // 전체 건수
    private int successCount;                     // 성공 건수
    private int failCount;                        // 실패 건수
    private long totalElapsedMs;                  // 전체 소요시간 (ms)
    private double avgResponseTimeMs;             // 평균 응답시간 (ms)
    private long minResponseTimeMs;               // 최소 응답시간
    private long maxResponseTimeMs;               // 최대 응답시간
    private List<BatchTestItemResult> results;    // 건별 결과

    // Getters & Setters
    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public String getExecutionMode() { return executionMode; }
    public void setExecutionMode(String executionMode) { this.executionMode = executionMode; }

    public int getTotalCount() { return totalCount; }
    public void setTotalCount(int totalCount) { this.totalCount = totalCount; }

    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }

    public int getFailCount() { return failCount; }
    public void setFailCount(int failCount) { this.failCount = failCount; }

    public long getTotalElapsedMs() { return totalElapsedMs; }
    public void setTotalElapsedMs(long totalElapsedMs) { this.totalElapsedMs = totalElapsedMs; }

    public double getAvgResponseTimeMs() { return avgResponseTimeMs; }
    public void setAvgResponseTimeMs(double avgResponseTimeMs) { this.avgResponseTimeMs = avgResponseTimeMs; }

    public long getMinResponseTimeMs() { return minResponseTimeMs; }
    public void setMinResponseTimeMs(long minResponseTimeMs) { this.minResponseTimeMs = minResponseTimeMs; }

    public long getMaxResponseTimeMs() { return maxResponseTimeMs; }
    public void setMaxResponseTimeMs(long maxResponseTimeMs) { this.maxResponseTimeMs = maxResponseTimeMs; }

    public List<BatchTestItemResult> getResults() { return results; }
    public void setResults(List<BatchTestItemResult> results) { this.results = results; }

    // 건별 결과
    public static class BatchTestItemResult {
        private int sequence;                     // 실행 순번
        private String status;                    // SUCCESS | FAIL | TIMEOUT
        private long responseTimeMs;              // 응답시간 (ms)
        private String requestRaw;                // 요청 원문
        private String responseRaw;               // 응답 원문
        private String errorMessage;              // 에러 메시지
        private java.util.Map<String, String> responseFields; // 응답 파싱 결과

        // Getters & Setters
        public int getSequence() { return sequence; }
        public void setSequence(int sequence) { this.sequence = sequence; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public long getResponseTimeMs() { return responseTimeMs; }
        public void setResponseTimeMs(long responseTimeMs) { this.responseTimeMs = responseTimeMs; }

        public String getRequestRaw() { return requestRaw; }
        public void setRequestRaw(String requestRaw) { this.requestRaw = requestRaw; }

        public String getResponseRaw() { return responseRaw; }
        public void setResponseRaw(String responseRaw) { this.responseRaw = responseRaw; }

        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

        public java.util.Map<String, String> getResponseFields() { return responseFields; }
        public void setResponseFields(java.util.Map<String, String> responseFields) { this.responseFields = responseFields; }
    }
}
