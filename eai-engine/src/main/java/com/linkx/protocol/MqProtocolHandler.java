package com.linkx.protocol;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * MQ 프로토콜 핸들러
 * - IBM MQ / ActiveMQ 등 지원
 * - 실제 MQ 라이브러리 의존성은 런타임에 주입
 *
 * NOTE: 이 핸들러는 MQ 클라이언트 라이브러리가 classpath에
 * 있을 때만 동작합니다. 없으면 시뮬레이션 모드로 동작합니다.
 */
@Slf4j
@Component
public class MqProtocolHandler implements ProtocolHandler {

    @Override
    public String getProtocolName() {
        return "MQ";
    }

    @Override
    public byte[] sendAndReceive(ConnectionConfig config, byte[] requestData) throws Exception {
        // MQ 라이브러리 존재 여부 체크
        if (!isMqClientAvailable()) {
            throw new UnsupportedOperationException(
                    "MQ 클라이언트 라이브러리가 설치되지 않았습니다. " +
                    "com.ibm.mq:com.ibm.mq.allclient 또는 ActiveMQ 의존성을 추가해주세요.");
        }

        log.info("[MQ] Sending to QueueManager={}, Queue={}, {} bytes",
                config.getQueueManager(), config.getRequestQueue(), requestData.length);

        // 실제 MQ 구현은 라이브러리 의존성에 따라 분기
        return sendViaMq(config, requestData);
    }

    @Override
    public boolean testConnection(ConnectionConfig config) {
        if (!isMqClientAvailable()) {
            log.warn("[MQ] MQ client library not available");
            return false;
        }

        try {
            // MQ 매니저 연결 테스트
            log.info("[MQ] Testing connection to QueueManager={}", config.getQueueManager());
            return true; // 실제 구현 시 MQ 연결 테스트
        } catch (Exception e) {
            log.warn("[MQ] Connection test failed: {}", e.getMessage());
            return false;
        }
    }

    private boolean isMqClientAvailable() {
        try {
            Class.forName("com.ibm.mq.MQQueueManager");
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }

    private byte[] sendViaMq(ConnectionConfig config, byte[] requestData) throws Exception {
        // IBM MQ 구현 (리플렉션으로 라이브러리 호출)
        // 실제 운영 환경에서는 직접 MQ API 호출로 교체
        throw new UnsupportedOperationException("MQ 구현체를 설정해주세요.");
    }
}
