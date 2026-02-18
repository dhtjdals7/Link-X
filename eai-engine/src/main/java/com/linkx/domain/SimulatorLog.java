package com.linkx.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 시뮬레이터 수신/응답 로그 엔티티
 * TCP 리스너가 수신한 전문과 생성한 응답을 기록
 */
@Entity
@Table(name = "TB_SIMULATOR_LOG")
public class SimulatorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 리스너 설정 ID */
    @Column(name = "config_id")
    private Long configId;

    /** 추출된 전문코드 */
    @Column(name = "telegram_id", length = 50)
    private String telegramId;

    /** 클라이언트 IP */
    @Column(name = "client_ip", length = 50)
    private String clientIp;

    /** 클라이언트 포트 */
    @Column(name = "client_port")
    private int clientPort;

    /** 수신 원문 (Raw) */
    @Column(name = "request_raw", columnDefinition = "TEXT")
    private String requestRaw;

    /** 응답 원문 (Raw) */
    @Column(name = "response_raw", columnDefinition = "TEXT")
    private String responseRaw;

    /** 처리 상태 (SUCCESS / PARSE_ERROR / NO_RULE / ERROR) */
    @Column(name = "status", length = 20)
    private String status;

    /** 에러 메시지 */
    @Column(name = "error_message", length = 500)
    private String errorMessage;

    /** 처리 시간 (ms) */
    @Column(name = "process_time_ms")
    private long processTimeMs;

    /** 수신 시각 */
    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @PrePersist
    protected void onCreate() {
        if (receivedAt == null) {
            receivedAt = LocalDateTime.now();
        }
    }

    // === Getters & Setters ===
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getConfigId() { return configId; }
    public void setConfigId(Long configId) { this.configId = configId; }

    public String getTelegramId() { return telegramId; }
    public void setTelegramId(String telegramId) { this.telegramId = telegramId; }

    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }

    public int getClientPort() { return clientPort; }
    public void setClientPort(int clientPort) { this.clientPort = clientPort; }

    public String getRequestRaw() { return requestRaw; }
    public void setRequestRaw(String requestRaw) { this.requestRaw = requestRaw; }

    public String getResponseRaw() { return responseRaw; }
    public void setResponseRaw(String responseRaw) { this.responseRaw = responseRaw; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public long getProcessTimeMs() { return processTimeMs; }
    public void setProcessTimeMs(long processTimeMs) { this.processTimeMs = processTimeMs; }

    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }
}
