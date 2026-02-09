package com.linkx.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * 전문 레이아웃 메타데이터
 * - 기존 EAI DB 메타데이터 테이블과 호환
 * - 전문코드(telegramId) 기준으로 필드 목록 관리
 */
@Entity
@Table(name = "TB_TELEGRAM_LAYOUT")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelegramLayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 전문코드 (예: "HR0001", "FN1001") */
    @Column(name = "TELEGRAM_ID", nullable = false, length = 20)
    private String telegramId;

    /** 전문명 */
    @Column(name = "TELEGRAM_NAME", length = 100)
    private String telegramName;

    /** 필드 순번 */
    @Column(name = "FIELD_SEQ", nullable = false)
    private Integer fieldSeq;

    /** 필드명 (영문) */
    @Column(name = "FIELD_NAME", nullable = false, length = 50)
    private String fieldName;

    /** 필드 한글명 */
    @Column(name = "FIELD_NAME_KR", length = 100)
    private String fieldNameKr;

    /** 필드 길이 (byte) */
    @Column(name = "FIELD_LENGTH", nullable = false)
    private Integer fieldLength;

    /** 데이터 타입: STRING, NUMBER, DATE, FILLER */
    @Column(name = "DATA_TYPE", nullable = false, length = 10)
    private String dataType;

    /** 정렬 방식: LEFT (문자), RIGHT (숫자) */
    @Column(name = "ALIGN", length = 5)
    @Builder.Default
    private String align = "LEFT";

    /** 패딩 문자: 공백(' ') 또는 '0' */
    @Column(name = "PAD_CHAR", length = 1)
    @Builder.Default
    private String padChar = " ";

    /** 기본값 */
    @Column(name = "DEFAULT_VALUE", length = 200)
    private String defaultValue;

    /** 필수 여부 */
    @Column(name = "REQUIRED")
    @Builder.Default
    private Boolean required = false;

    /** 설명 */
    @Column(name = "DESCRIPTION", length = 500)
    private String description;

    /** 공통헤더/개별부 구분: HEADER, BODY */
    @Column(name = "SECTION", length = 10)
    @Builder.Default
    private String section = "BODY";

    /** 활성 여부 */
    @Column(name = "ACTIVE")
    @Builder.Default
    private Boolean active = true;
}
