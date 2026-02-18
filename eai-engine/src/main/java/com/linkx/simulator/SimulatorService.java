package com.linkx.simulator;

import com.linkx.domain.ResponseRule;
import com.linkx.domain.SimulatorConfig;
import com.linkx.domain.SimulatorLog;
import com.linkx.repository.ResponseRuleRepository;
import com.linkx.repository.SimulatorConfigRepository;
import com.linkx.repository.SimulatorLogRepository;
import com.linkx.repository.TelegramLayoutRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 시뮬레이터 관리 서비스
 *
 * TCP 리스너의 시작/중지/상태관리,
 * 응답 규칙 CRUD, 로그 조회
 */
@Service
public class SimulatorService {

    private static final Logger log = LoggerFactory.getLogger(SimulatorService.class);

    private final SimulatorConfigRepository configRepository;
    private final ResponseRuleRepository ruleRepository;
    private final SimulatorLogRepository logRepository;
    private final TelegramLayoutRepository layoutRepository;
    private final ResponseGenerator responseGenerator;

    /** 실행 중인 리스너 관리 (configId → TcpListener) */
    private final ConcurrentHashMap<Long, TcpListener> activeListeners = new ConcurrentHashMap<>();

    /** 리스너 스레드 관리 */
    private final ConcurrentHashMap<Long, Thread> listenerThreads = new ConcurrentHashMap<>();

    public SimulatorService(SimulatorConfigRepository configRepository,
                            ResponseRuleRepository ruleRepository,
                            SimulatorLogRepository logRepository,
                            TelegramLayoutRepository layoutRepository,
                            ResponseGenerator responseGenerator) {
        this.configRepository = configRepository;
        this.ruleRepository = ruleRepository;
        this.logRepository = logRepository;
        this.layoutRepository = layoutRepository;
        this.responseGenerator = responseGenerator;
    }

    // ==================== 리스너 제어 ====================

    /**
     * 리스너 시작
     */
    public Map<String, Object> startListener(Long configId) {
        SimulatorConfig config = configRepository.findById(configId)
                .orElseThrow(() -> new RuntimeException("설정을 찾을 수 없습니다: " + configId));

        // 이미 실행 중인지 체크
        TcpListener existing = activeListeners.get(configId);
        if (existing != null && existing.isRunning()) {
            throw new RuntimeException("이미 실행 중인 리스너입니다 (포트: " + config.getPort() + ")");
        }

        // 포트 중복 체크
        for (TcpListener listener : activeListeners.values()) {
            if (listener.isRunning() && listener.getConfig().getPort() == config.getPort()) {
                throw new RuntimeException("포트 " + config.getPort() + "이 이미 사용 중입니다");
            }
        }

        TcpListener listener = new TcpListener(config, layoutRepository, logRepository, responseGenerator);
        Thread thread = new Thread(listener, "tcp-listener-" + config.getPort());
        thread.setDaemon(true);
        thread.start();

        activeListeners.put(configId, listener);
        listenerThreads.put(configId, thread);

        log.info("리스너 시작 요청: {} (포트: {})", config.getName(), config.getPort());

        return listener.getStats();
    }

    /**
     * 리스너 중지
     */
    public Map<String, Object> stopListener(Long configId) {
        TcpListener listener = activeListeners.get(configId);
        if (listener == null) {
            throw new RuntimeException("실행 중인 리스너가 없습니다: " + configId);
        }

        listener.stop();
        activeListeners.remove(configId);

        Thread thread = listenerThreads.remove(configId);
        if (thread != null) {
            thread.interrupt();
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("configId", configId);
        result.put("status", "STOPPED");
        return result;
    }

    /**
     * 전체 리스너 상태 조회
     */
    public List<Map<String, Object>> getListenerStatuses() {
        List<SimulatorConfig> configs = configRepository.findAll();
        List<Map<String, Object>> statuses = new ArrayList<>();

        for (SimulatorConfig config : configs) {
            Map<String, Object> status = new LinkedHashMap<>();
            status.put("configId", config.getId());
            status.put("name", config.getName());
            status.put("port", config.getPort());
            status.put("encoding", config.getEncoding());
            status.put("lengthHeaderSize", config.getLengthHeaderSize());
            status.put("responseDelayMs", config.getResponseDelayMs());
            status.put("active", config.isActive());

            TcpListener listener = activeListeners.get(config.getId());
            if (listener != null && listener.isRunning()) {
                status.put("running", true);
                status.putAll(listener.getStats());
            } else {
                status.put("running", false);
                status.put("totalRequests", 0);
                status.put("successCount", 0);
                status.put("errorCount", 0);
            }

            statuses.add(status);
        }
        return statuses;
    }

    /**
     * 전체 리스너 중지
     */
    public void stopAll() {
        activeListeners.forEach((id, listener) -> {
            listener.stop();
        });
        activeListeners.clear();
        listenerThreads.values().forEach(Thread::interrupt);
        listenerThreads.clear();
        log.info("전체 리스너 중지 완료");
    }

    // ==================== 시뮬레이터 설정 CRUD ====================

    public List<SimulatorConfig> getAllConfigs() {
        return configRepository.findAll();
    }

    public SimulatorConfig getConfig(Long id) {
        return configRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("설정을 찾을 수 없습니다: " + id));
    }

    @Transactional
    public SimulatorConfig saveConfig(SimulatorConfig config) {
        // 포트 중복 체크 (신규 등록 시)
        if (config.getId() == null) {
            configRepository.findByPort(config.getPort()).ifPresent(existing -> {
                throw new RuntimeException("포트 " + config.getPort() + "가 이미 등록되어 있습니다");
            });
        }
        return configRepository.save(config);
    }

    @Transactional
    public void deleteConfig(Long id) {
        // 실행 중이면 먼저 중지
        TcpListener listener = activeListeners.get(id);
        if (listener != null && listener.isRunning()) {
            listener.stop();
            activeListeners.remove(id);
        }
        configRepository.deleteById(id);
    }

    // ==================== 응답 규칙 CRUD ====================

    public List<ResponseRule> getRulesByTelegramId(String telegramId) {
        return ruleRepository.findByTelegramIdOrderBySortOrderAsc(telegramId);
    }

    public List<String> getConfiguredTelegramIds() {
        return ruleRepository.findDistinctActiveTelegramIds();
    }

    @Transactional
    public ResponseRule saveRule(ResponseRule rule) {
        return ruleRepository.save(rule);
    }

    @Transactional
    public List<ResponseRule> saveRules(List<ResponseRule> rules) {
        return ruleRepository.saveAll(rules);
    }

    @Transactional
    public void deleteRule(Long ruleId) {
        ruleRepository.deleteById(ruleId);
    }

    @Transactional
    public void deleteRulesByTelegramId(String telegramId) {
        ruleRepository.deleteByTelegramId(telegramId);
    }

    // ==================== 로그 조회 ====================

    public List<SimulatorLog> getRecentLogs() {
        return logRepository.findTop50ByOrderByReceivedAtDesc();
    }

    public List<SimulatorLog> getLogsByConfigId(Long configId) {
        return logRepository.findByConfigIdOrderByReceivedAtDesc(configId);
    }

    public List<SimulatorLog> getLogsByTelegramId(String telegramId) {
        return logRepository.findByTelegramIdOrderByReceivedAtDesc(telegramId);
    }
}
