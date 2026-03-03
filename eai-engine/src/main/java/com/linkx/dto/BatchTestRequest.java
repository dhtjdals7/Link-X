package com.linkx.dto;

import java.util.List;
import java.util.Map;

public class BatchTestRequest {

    private String telegramId;                    // 전문코드
    private String profileId;                     // 접속 프로파일 ID
    private String executionMode;                 // SEQUENTIAL | PARALLEL
    private int repeatCount;                      // 반복 횟수
    private int delayMs;                          // 건별 딜레이 (순차 실행 시)
    private int parallelThreads;                  // 병렬 스레드 수 (병렬 실행 시)
    private List<Map<String, String>> itemOverrides; // 건별 필드값 오버라이드 (null이면 동일값 반복)
    private Map<String, String> baseFieldValues;  // 기본 필드값

    // Getters & Setters
    public String getTelegramId() { return telegramId; }
    public void setTelegramId(String telegramId) { this.telegramId = telegramId; }

    public String getProfileId() { return profileId; }
    public void setProfileId(String profileId) { this.profileId = profileId; }

    public String getExecutionMode() { return executionMode; }
    public void setExecutionMode(String executionMode) { this.executionMode = executionMode; }

    public int getRepeatCount() { return repeatCount; }
    public void setRepeatCount(int repeatCount) { this.repeatCount = repeatCount; }

    public int getDelayMs() { return delayMs; }
    public void setDelayMs(int delayMs) { this.delayMs = delayMs; }

    public int getParallelThreads() { return parallelThreads; }
    public void setParallelThreads(int parallelThreads) { this.parallelThreads = parallelThreads; }

    public List<Map<String, String>> getItemOverrides() { return itemOverrides; }
    public void setItemOverrides(List<Map<String, String>> itemOverrides) { this.itemOverrides = itemOverrides; }

    public Map<String, String> getBaseFieldValues() { return baseFieldValues; }
    public void setBaseFieldValues(Map<String, String> baseFieldValues) { this.baseFieldValues = baseFieldValues; }
}
