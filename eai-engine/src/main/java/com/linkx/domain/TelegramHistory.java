package com.linkx.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 전문 송수신 이력
 */
@Entity
@Table(name = "TB_TELEGRAM_HISTORY")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelegramHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 전문코드 */
    @Column(name = "TELEGRAM_ID", nullable = false, length = 20)
    private String telegramId;

    /** 프로토콜: TCP, HTTP, MQ */
    @Column(name = "PROTOCOL", nullable = false, length = 10)
    private String protocol;

    /** 방향: SEND, RECV */
    @Column(name = "DIRECTION", nullable = false, length = 4)
    private String direction;

    /** 접속 대상 (host:port 또는 URL) */
    @Column(name = "TARGET", length = 300)
    private String target;

    /** 송신 원문 (Full raw bytes hex) */
    @Column(name = "RAW_REQUEST", columnDefinition = "TEXT")
    private String rawRequest;

    /** 수신 원문 */
    @Column(name = "RAW_RESPONSE", columnDefinition = "TEXT")
    private String rawResponse;

    /** 파싱된 송신 JSON */
    @Column(name = "PARSED_REQUEST", columnDefinition = "TEXT")
    private String parsedRequest;

    /** 파싱된 수신 JSON */
    @Column(name = "PARSED_RESPONSE", columnDefinition = "TEXT")
    private String parsedResponse;

    /** 응답코드 */
    @Column(name = "RESPONSE_CODE", length = 10)
    private String responseCode;

    /** 처리시간 (ms) */
    @Column(name = "ELAPSED_MS")
    private Long elapsedMs;

    /** 성공 여부 */
    @Column(name = "SUCCESS")
    private Boolean success;

    /** 에러 메시지 */
    @Column(name = "ERROR_MESSAGE", length = 1000)
    private String errorMessage;

    /** 생성일시 */
    @Column(name = "CREATED_AT")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /** 메모 */
    @Column(name = "MEMO", length = 500)
    private String memo;
}
