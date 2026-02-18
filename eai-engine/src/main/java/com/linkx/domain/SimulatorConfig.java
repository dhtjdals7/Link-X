package com.linkx.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 시뮬레이터 리스너 설정 엔티티
 * TCP 리스너의 포트, 인코딩, 길이헤더 설정 등을 관리
 */
@Entity
@Table(name = "TB_SIMULATOR_CONFIG")
public class SimulatorConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 리스너 이름 (예: "계정계 시뮬레이터", "대외기관 Mock") */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /** 리스닝 포트 */
    @Column(name = "port", nullable = false)
    private int port;

    /** 인코딩 (EUC-KR / UTF-8 / MS949) */
    @Column(name = "encoding", nullable = false, length = 20)
    private String encoding = "EUC-KR";

    /** 길이 헤더 크기 (4 / 8 byte, 0이면 길이헤더 없음) */
    @Column(name = "length_header_size")
    private int lengthHeaderSize = 4;

    /** 길이 헤더에 자기 자신 포함 여부 */
    @Column(name = "length_includes_header")
    private boolean lengthIncludesHeader = false;

    /** 전문코드 추출 시작 오프셋 (길이헤더 이후 기준) */
    @Column(name = "telegram_id_offset")
    private int telegramIdOffset = 0;

    /** 전문코드 길이 */
    @Column(name = "telegram_id_length")
    private int telegramIdLength = 4;

    /** 응답 지연 시간 (ms) — 실제 서버 응답 시뮬레이션용 */
    @Column(name = "response_delay_ms")
    private int responseDelayMs = 0;

    /** 활성/비활성 */
    @Column(name = "active", nullable = false)
    private boolean active = true;

    /** 설명 */
    @Column(name = "description", length = 200)
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // === Getters & Setters ===
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }

    public String getEncoding() { return encoding; }
    public void setEncoding(String encoding) { this.encoding = encoding; }

    public int getLengthHeaderSize() { return lengthHeaderSize; }
    public void setLengthHeaderSize(int lengthHeaderSize) { this.lengthHeaderSize = lengthHeaderSize; }

    public boolean isLengthIncludesHeader() { return lengthIncludesHeader; }
    public void setLengthIncludesHeader(boolean lengthIncludesHeader) { this.lengthIncludesHeader = lengthIncludesHeader; }

    public int getTelegramIdOffset() { return telegramIdOffset; }
    public void setTelegramIdOffset(int telegramIdOffset) { this.telegramIdOffset = telegramIdOffset; }

    public int getTelegramIdLength() { return telegramIdLength; }
    public void setTelegramIdLength(int telegramIdLength) { this.telegramIdLength = telegramIdLength; }

    public int getResponseDelayMs() { return responseDelayMs; }
    public void setResponseDelayMs(int responseDelayMs) { this.responseDelayMs = responseDelayMs; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
