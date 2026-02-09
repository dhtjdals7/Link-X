package com.linkx.protocol;

/**
 * 프로토콜별 송수신 인터페이스
 */
public interface ProtocolHandler {

    String getProtocolName();

    /**
     * 전문 송신 후 응답 수신
     * @param config 접속 설정
     * @param requestData 송신 데이터
     * @return 수신 데이터
     */
    byte[] sendAndReceive(ConnectionConfig config, byte[] requestData) throws Exception;

    /**
     * 연결 테스트
     */
    boolean testConnection(ConnectionConfig config);
}
