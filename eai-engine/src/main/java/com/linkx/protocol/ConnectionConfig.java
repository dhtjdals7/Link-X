package com.linkx.protocol;

import lombok.Builder;
import lombok.Data;

/**
 * 프로토콜 커넥션 설정
 */
@Data
@Builder
public class ConnectionConfig {
    private String protocol;     // TCP, HTTP, MQ
    private String host;
    private int port;
    private String url;          // HTTP용
    private int timeoutMs;
    private String charset;

    // MQ 전용
    private String queueManager;
    private String requestQueue;
    private String responseQueue;

    // HTTP 전용
    private String httpMethod;   // POST, GET
    private String contentType;
    private java.util.Map<String, String> headers;

    // TCP 전용
    private boolean includeLengthHeader;
    private int lengthHeaderSize;  // 보통 4 or 8
}
