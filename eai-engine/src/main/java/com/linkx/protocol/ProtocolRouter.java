package com.linkx.protocol;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 프로토콜 라우터
 * - 등록된 ProtocolHandler 중 protocol 이름에 맞는 핸들러 자동 선택
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProtocolRouter {

    private final List<ProtocolHandler> handlers;
    private final Map<String, ProtocolHandler> handlerMap = new HashMap<>();

    @PostConstruct
    public void init() {
        for (ProtocolHandler handler : handlers) {
            handlerMap.put(handler.getProtocolName().toUpperCase(), handler);
            log.info("Registered protocol handler: {}", handler.getProtocolName());
        }
    }

    public ProtocolHandler getHandler(String protocol) {
        ProtocolHandler handler = handlerMap.get(protocol.toUpperCase());
        if (handler == null) {
            throw new IllegalArgumentException("지원하지 않는 프로토콜: " + protocol
                    + " (지원: " + handlerMap.keySet() + ")");
        }
        return handler;
    }

    public byte[] sendAndReceive(ConnectionConfig config, byte[] data) throws Exception {
        ProtocolHandler handler = getHandler(config.getProtocol());
        return handler.sendAndReceive(config, data);
    }

    public boolean testConnection(ConnectionConfig config) {
        ProtocolHandler handler = getHandler(config.getProtocol());
        return handler.testConnection(config);
    }

    public List<String> getSupportedProtocols() {
        return List.copyOf(handlerMap.keySet());
    }
}
