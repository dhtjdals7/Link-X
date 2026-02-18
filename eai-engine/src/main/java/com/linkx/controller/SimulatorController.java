package com.linkx.controller;

import com.linkx.domain.ResponseRule;
import com.linkx.domain.SimulatorConfig;
import com.linkx.domain.SimulatorLog;
import com.linkx.simulator.SimulatorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 시뮬레이터 REST API Controller
 *
 * 리스너 제어, 응답 규칙 관리, 수신/응답 로그 조회
 */
@RestController
@RequestMapping("/api/simulator")
public class SimulatorController {

    private final SimulatorService simulatorService;

    public SimulatorController(SimulatorService simulatorService) {
        this.simulatorService = simulatorService;
    }

    // ==================== 리스너 제어 ====================

    /** 리스너 시작 */
    @PostMapping("/listener/{configId}/start")
    public ResponseEntity<Map<String, Object>> startListener(@PathVariable Long configId) {
        return ResponseEntity.ok(simulatorService.startListener(configId));
    }

    /** 리스너 중지 */
    @PostMapping("/listener/{configId}/stop")
    public ResponseEntity<Map<String, Object>> stopListener(@PathVariable Long configId) {
        return ResponseEntity.ok(simulatorService.stopListener(configId));
    }

    /** 전체 리스너 상태 조회 */
    @GetMapping("/listener/status")
    public ResponseEntity<List<Map<String, Object>>> getListenerStatuses() {
        return ResponseEntity.ok(simulatorService.getListenerStatuses());
    }

    /** 전체 리스너 중지 */
    @PostMapping("/listener/stop-all")
    public ResponseEntity<Map<String, String>> stopAll() {
        simulatorService.stopAll();
        return ResponseEntity.ok(Map.of("status", "ALL_STOPPED"));
    }

    // ==================== 시뮬레이터 설정 CRUD ====================

    /** 전체 설정 조회 */
    @GetMapping("/config")
    public ResponseEntity<List<SimulatorConfig>> getAllConfigs() {
        return ResponseEntity.ok(simulatorService.getAllConfigs());
    }

    /** 설정 상세 조회 */
    @GetMapping("/config/{id}")
    public ResponseEntity<SimulatorConfig> getConfig(@PathVariable Long id) {
        return ResponseEntity.ok(simulatorService.getConfig(id));
    }

    /** 설정 등록/수정 */
    @PostMapping("/config")
    public ResponseEntity<SimulatorConfig> saveConfig(@RequestBody SimulatorConfig config) {
        return ResponseEntity.ok(simulatorService.saveConfig(config));
    }

    /** 설정 수정 */
    @PutMapping("/config/{id}")
    public ResponseEntity<SimulatorConfig> updateConfig(@PathVariable Long id,
                                                        @RequestBody SimulatorConfig config) {
        config.setId(id);
        return ResponseEntity.ok(simulatorService.saveConfig(config));
    }

    /** 설정 삭제 */
    @DeleteMapping("/config/{id}")
    public ResponseEntity<Void> deleteConfig(@PathVariable Long id) {
        simulatorService.deleteConfig(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== 응답 규칙 CRUD ====================

    /** 전문코드별 응답 규칙 조회 */
    @GetMapping("/rule/{telegramId}")
    public ResponseEntity<List<ResponseRule>> getRules(@PathVariable String telegramId) {
        return ResponseEntity.ok(simulatorService.getRulesByTelegramId(telegramId));
    }

    /** 응답 규칙이 설정된 전문코드 목록 */
    @GetMapping("/rule/telegram-ids")
    public ResponseEntity<List<String>> getConfiguredTelegramIds() {
        return ResponseEntity.ok(simulatorService.getConfiguredTelegramIds());
    }

    /** 응답 규칙 등록/수정 */
    @PostMapping("/rule")
    public ResponseEntity<ResponseRule> saveRule(@RequestBody ResponseRule rule) {
        return ResponseEntity.ok(simulatorService.saveRule(rule));
    }

    /** 응답 규칙 일괄 등록 */
    @PostMapping("/rule/batch")
    public ResponseEntity<List<ResponseRule>> saveRules(@RequestBody List<ResponseRule> rules) {
        return ResponseEntity.ok(simulatorService.saveRules(rules));
    }

    /** 응답 규칙 삭제 */
    @DeleteMapping("/rule/{ruleId}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long ruleId) {
        simulatorService.deleteRule(ruleId);
        return ResponseEntity.noContent().build();
    }

    /** 전문코드별 규칙 전체 삭제 */
    @DeleteMapping("/rule/telegram/{telegramId}")
    public ResponseEntity<Void> deleteRulesByTelegramId(@PathVariable String telegramId) {
        simulatorService.deleteRulesByTelegramId(telegramId);
        return ResponseEntity.noContent().build();
    }

    // ==================== 로그 조회 ====================

    /** 최근 로그 조회 */
    @GetMapping("/log")
    public ResponseEntity<List<SimulatorLog>> getRecentLogs() {
        return ResponseEntity.ok(simulatorService.getRecentLogs());
    }

    /** 설정별 로그 조회 */
    @GetMapping("/log/config/{configId}")
    public ResponseEntity<List<SimulatorLog>> getLogsByConfig(@PathVariable Long configId) {
        return ResponseEntity.ok(simulatorService.getLogsByConfigId(configId));
    }

    /** 전문코드별 로그 조회 */
    @GetMapping("/log/telegram/{telegramId}")
    public ResponseEntity<List<SimulatorLog>> getLogsByTelegram(@PathVariable String telegramId) {
        return ResponseEntity.ok(simulatorService.getLogsByTelegramId(telegramId));
    }
}
