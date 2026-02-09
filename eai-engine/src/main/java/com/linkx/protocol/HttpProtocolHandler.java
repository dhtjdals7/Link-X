package com.linkx.protocol;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * HTTP 프로토콜 핸들러
 * - REST API 래핑된 전문 테스트용
 */
@Slf4j
@Component
public class HttpProtocolHandler implements ProtocolHandler {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    public String getProtocolName() {
        return "HTTP";
    }

    @Override
    public byte[] sendAndReceive(ConnectionConfig config, byte[] requestData) throws Exception {
        String url = config.getUrl();
        if (url == null || url.isEmpty()) {
            url = String.format("http://%s:%d", config.getHost(), config.getPort());
        }

        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofMillis(config.getTimeoutMs() > 0 ? config.getTimeoutMs() : 30000));

        // 커스텀 헤더
        if (config.getHeaders() != null) {
            config.getHeaders().forEach(requestBuilder::header);
        }

        String contentType = config.getContentType() != null ? config.getContentType() : "application/octet-stream";
        requestBuilder.header("Content-Type", contentType);

        String method = config.getHttpMethod() != null ? config.getHttpMethod().toUpperCase() : "POST";
        if ("POST".equals(method)) {
            requestBuilder.POST(HttpRequest.BodyPublishers.ofByteArray(requestData));
        } else if ("PUT".equals(method)) {
            requestBuilder.PUT(HttpRequest.BodyPublishers.ofByteArray(requestData));
        } else {
            requestBuilder.GET();
        }

        HttpResponse<byte[]> response = httpClient.send(requestBuilder.build(),
                HttpResponse.BodyHandlers.ofByteArray());

        log.info("[HTTP] {} {} → Status: {}, Body: {} bytes",
                method, url, response.statusCode(), response.body().length);

        return response.body();
    }

    @Override
    public boolean testConnection(ConnectionConfig config) {
        try {
            String url = config.getUrl() != null ? config.getUrl()
                    : String.format("http://%s:%d", config.getHost(), config.getPort());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(5))
                    .method("HEAD", HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            return response.statusCode() < 500;
        } catch (Exception e) {
            log.warn("[HTTP] Connection test failed: {} - {}", config.getUrl(), e.getMessage());
            return false;
        }
    }
}
