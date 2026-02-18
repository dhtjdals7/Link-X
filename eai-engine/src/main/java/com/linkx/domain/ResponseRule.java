package com.linkx.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 시뮬레이터 응답 규칙 엔티티
 * 전문코드별 필드에 대해 어떤 방식으로 응답값을 생성할지 정의
 *
 * ruleType:
 *   FIXED    — 고정값 (fixedValue에 지정된 값 그대로)
 *   ECHO     — 요청 전문에서 동일 필드값을 에코백
 *   ECHO_FROM — 요청 전문의 다른 필드값을 복사 (sourceField 지정)
 *   TIMESTAMP — 현재 시각 (yyyyMMddHHmmss 등 format 지정 가능)
 *   SEQUENCE  — 순차 번호 (seqPrefix + 자동 증가)
 *   DEFAULT   — 레이아웃 기본값 사용 (규칙 미설정 필드와 동일)
 */
@Entity
@Table(name = "TB_RESPONSE_RULE",
       uniqueConstraints = @UniqueConstraint(columnNames = {"telegram_id", "field_name"}))
public class ResponseRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 전문코드 (예: "0200", "ACCT_INQ") */
    @Column(name = "telegram_id", nullable = false, length = 50)
    private String telegramId;

    /** 필드명 (레이아웃의 fieldName과 매칭) */
    @Column(name = "field_name", nullable = false, length = 100)
    private String fieldName;

    /** 응답 규칙 타입 */
    @Column(name = "rule_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private RuleType ruleType;

    /** FIXED 타입일 때 사용할 고정값 */
    @Column(name = "fixed_value", length = 500)
    private String fixedValue;

    /** ECHO_FROM 타입일 때 복사할 소스 필드명 */
    @Column(name = "source_field", length = 100)
    private String sourceField;

    /** TIMESTAMP 타입일 때 날짜 포맷 (기본: yyyyMMddHHmmss) */
    @Column(name = "time_format", length = 50)
    private String timeFormat;

    /** SEQUENCE 타입일 때 접두사 */
    @Column(name = "seq_prefix", length = 20)
    private String seqPrefix;

    /** 규칙 적용 순서 (같은 전문코드 내에서) */
    @Column(name = "sort_order")
    private Integer sortOrder;

    /** 규칙 설명 메모 */
    @Column(name = "description", length = 200)
    private String description;

    /** 활성/비활성 */
    @Column(name = "active", nullable = false)
    private boolean active = true;

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

    // === Enum ===
    public enum RuleType {
        FIXED, ECHO, ECHO_FROM, TIMESTAMP, SEQUENCE, DEFAULT
    }

    // === Getters & Setters ===
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTelegramId() { return telegramId; }
    public void setTelegramId(String telegramId) { this.telegramId = telegramId; }

    public String getFieldName() { return fieldName; }
    public void setFieldName(String fieldName) { this.fieldName = fieldName; }

    public RuleType getRuleType() { return ruleType; }
    public void setRuleType(RuleType ruleType) { this.ruleType = ruleType; }

    public String getFixedValue() { return fixedValue; }
    public void setFixedValue(String fixedValue) { this.fixedValue = fixedValue; }

    public String getSourceField() { return sourceField; }
    public void setSourceField(String sourceField) { this.sourceField = sourceField; }

    public String getTimeFormat() { return timeFormat; }
    public void setTimeFormat(String timeFormat) { this.timeFormat = timeFormat; }

    public String getSeqPrefix() { return seqPrefix; }
    public void setSeqPrefix(String seqPrefix) { this.seqPrefix = seqPrefix; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
