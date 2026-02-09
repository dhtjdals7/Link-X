package com.linkx.protocol;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.*;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

/**
 * TCP/IP 소켓 통신 핸들러
 * - 동기 송수신
 * - 길이 헤더(4/8byte) 지원
 */
@Slf4j
@Component
public class TcpProtocolHandler implements ProtocolHandler {

    @Override
    public String getProtocolName() {
        return "TCP";
    }

    @Override
    public byte[] sendAndReceive(ConnectionConfig config, byte[] requestData) throws Exception {
        try (Socket socket = new Socket(config.getHost(), config.getPort())) {
            socket.setSoTimeout(config.getTimeoutMs() > 0 ? config.getTimeoutMs() : 30000);

            OutputStream out = socket.getOutputStream();
            InputStream in = socket.getInputStream();

            // 전문 길이 헤더 포함 여부
            if (config.isIncludeLengthHeader()) {
                byte[] lengthHeader = buildLengthHeader(requestData.length, config.getLengthHeaderSize());
                out.write(lengthHeader);
            }

            out.write(requestData);
            out.flush();
            log.info("[TCP] Sent {} bytes to {}:{}", requestData.length, config.getHost(), config.getPort());

            // 응답 수신
            byte[] response;
            if (config.isIncludeLengthHeader()) {
                response = readWithLengthHeader(in, config.getLengthHeaderSize());
            } else {
                response = readUntilClose(in);
            }

            log.info("[TCP] Received {} bytes", response.length);
            return response;
        }
    }

    @Override
    public boolean testConnection(ConnectionConfig config) {
        try (Socket socket = new Socket(config.getHost(), config.getPort())) {
            socket.setSoTimeout(3000);
            return socket.isConnected();
        } catch (Exception e) {
            log.warn("[TCP] Connection test failed: {}:{} - {}", config.getHost(), config.getPort(), e.getMessage());
            return false;
        }
    }

    private byte[] buildLengthHeader(int dataLength, int headerSize) {
        if (headerSize == 4) {
            // 4바이트 문자열 길이 (금융권 일반적 방식)
            return String.format("%04d", dataLength).getBytes(StandardCharsets.US_ASCII);
        } else if (headerSize == 8) {
            return String.format("%08d", dataLength).getBytes(StandardCharsets.US_ASCII);
        } else {
            // Binary 4byte
            return ByteBuffer.allocate(4).putInt(dataLength).array();
        }
    }

    private byte[] readWithLengthHeader(InputStream in, int headerSize) throws IOException {
        byte[] header = in.readNBytes(headerSize);
        if (header.length < headerSize) {
            throw new IOException("응답 길이 헤더 수신 실패");
        }

        int bodyLength;
        try {
            bodyLength = Integer.parseInt(new String(header, StandardCharsets.US_ASCII).trim());
        } catch (NumberFormatException e) {
            bodyLength = ByteBuffer.wrap(header).getInt();
        }

        byte[] body = in.readNBytes(bodyLength);
        if (body.length < bodyLength) {
            log.warn("[TCP] Expected {} bytes but received {}", bodyLength, body.length);
        }
        return body;
    }

    private byte[] readUntilClose(InputStream in) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] chunk = new byte[4096];
        int read;
        while ((read = in.read(chunk)) != -1) {
            buffer.write(chunk, 0, read);
        }
        return buffer.toByteArray();
    }
}
