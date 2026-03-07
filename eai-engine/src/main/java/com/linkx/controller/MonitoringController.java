package com.linkx.controller;

import com.linkx.simulator.SseEmitterManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

/**
 * 실시간 모니터링 API
 *
 * - SSE 스트리밍 (전문 수신 이벤트 실시간 푸시)
 * - 통계 스냅샷 조회
 * - 최근 로그 조회
 * - 통계 리셋
 */
@Slf4j
@RestController
@RequestMapping("/api/monitor")
@RequiredArgsConstructor
public class MonitoringController {

    private final SseEmitterManager sseEmitterManager;

    /**
     * SSE 스트리밍 연결
     *
     * 클라이언트가 이 엔드포인트에 연결하면:
     * 1. 즉시 현재 통계 스냅샷을 "init" 이벤트로 전송
     * 2. 이후 전문 수신마다 "log" + "stats" 이벤트를 실시간 푸시
     *
     * 이벤트 타입:
     * - init: 초기 통계 스냅샷
     * - log: 개별 전문 수신/응답 로그
     * - stats: 갱신된 통계 (TPS, 응답시간, 성공률 등)
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        log.info("SSE 모니터링 스트림 연결 요청");
        return sseEmitterManager.createEmitter();
    }

    /**
     * 현재 통계 스냅샷 (폴링 방식 fallback)
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(sseEmitterManager.getStatsSnapshot());
    }

    /**
     * 최근 로그 목록 (초기 로드용, 최근 100건)
     */
    @GetMapping("/logs")
    public ResponseEntity<List<Map<String, Object>>> getRecentLogs() {
        return ResponseEntity.ok(sseEmitterManager.getRecentLogs());
    }

    /**
     * 통계 리셋
     */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetStats() {
        sseEmitterManager.resetStats();
        log.info("모니터링 통계 리셋");
        return ResponseEntity.ok(Map.of("status", "RESET_COMPLETE"));
    }
}
