package com.linkx.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * 접속 환경 프로파일 (개발/검증/운영)
 */
@Entity
@Table(name = "TB_CONNECTION_PROFILE")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConnectionProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PROFILE_NAME", nullable = false, length = 50)
    private String profileName;

    @Column(name = "ENV", length = 10)
    private String env; // DEV, STG, PRD

    @Column(name = "PROTOCOL", nullable = false, length = 10)
    private String protocol;

    @Column(name = "HOST", length = 100)
    private String host;

    @Column(name = "PORT")
    private Integer port;

    @Column(name = "URL", length = 300)
    private String url;

    @Column(name = "TIMEOUT_MS")
    @Builder.Default
    private Integer timeoutMs = 30000;

    @Column(name = "CHARSET", length = 20)
    @Builder.Default
    private String charset = "EUC-KR";

    @Column(name = "INCLUDE_LENGTH_HEADER")
    @Builder.Default
    private Boolean includeLengthHeader = true;

    @Column(name = "LENGTH_HEADER_SIZE")
    @Builder.Default
    private Integer lengthHeaderSize = 4;

    @Column(name = "DESCRIPTION", length = 200)
    private String description;

    @Column(name = "ACTIVE")
    @Builder.Default
    private Boolean active = true;
}
