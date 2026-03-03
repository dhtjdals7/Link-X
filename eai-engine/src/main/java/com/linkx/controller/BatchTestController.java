package com.linkx.controller;

import com.linkx.dto.BatchTestRequest;
import com.linkx.dto.BatchTestResponse;
import com.linkx.service.BatchTestService;
import com.linkx.service.BatchTestService.BatchProgress;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/batch")
public class BatchTestController {

    private static final Logger log = LoggerFactory.getLogger(BatchTestController.class);

    private final BatchTestService batchTestService;

    public BatchTestController(BatchTestService batchTestService) {
        this.batchTestService = batchTestService;
    }

    /**
     * 배치 테스트 실행
     * POST /api/batch/execute
     */
    @PostMapping("/execute")
    public ResponseEntity<BatchTestResponse> executeBatch(@RequestBody BatchTestRequest request) {
        log.info("배치 테스트 요청 - telegramId={}, mode={}, count={}",
                request.getTelegramId(), request.getExecutionMode(), request.getRepeatCount());

        // 유효성 검사
        if (request.getRepeatCount() <= 0 || request.getRepeatCount() > 1000) {
            return ResponseEntity.badRequest().build();
        }
        if (request.getTelegramId() == null || request.getTelegramId().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        BatchTestResponse response = batchTestService.executeBatch(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 배치 진행 상황 조회
     * GET /api/batch/progress/{batchId}
     */
    @GetMapping("/progress/{batchId}")
    public ResponseEntity<Map<String, Object>> getProgress(@PathVariable String batchId) {
        BatchProgress progress = batchTestService.getProgress(batchId);
        if (progress == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("batchId", batchId);
        result.put("total", progress.getTotal());
        result.put("completed", progress.getCompleted());
        result.put("progressPercent", progress.getProgressPercent());
        result.put("cancelled", progress.isCancelled());

        return ResponseEntity.ok(result);
    }

    /**
     * 배치 중단
     * POST /api/batch/cancel/{batchId}
     */
    @PostMapping("/cancel/{batchId}")
    public ResponseEntity<Map<String, String>> cancelBatch(@PathVariable String batchId) {
        batchTestService.cancelBatch(batchId);

        Map<String, String> result = new HashMap<>();
        result.put("batchId", batchId);
        result.put("status", "CANCEL_REQUESTED");

        return ResponseEntity.ok(result);
    }
}
