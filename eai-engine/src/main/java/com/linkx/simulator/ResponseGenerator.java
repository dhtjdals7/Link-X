package com.linkx.simulator;

import com.linkx.domain.ResponseRule;
import com.linkx.domain.ResponseRule.RuleType;
import com.linkx.repository.ResponseRuleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 응답 전문 생성 엔진
 *
 * 수신된 전문의 파싱 결과(필드맵)와 응답 규칙을 기반으로
 * 응답 전문의 필드값을 자동 생성
 */
@Component
public class ResponseGenerator {

    private static final Logger log = LoggerFactory.getLogger(ResponseGenerator.class);

    private final ResponseRuleRepository ruleRepository;

    /** SEQUENCE 타입 카운터 (전문코드별) */
    private final ConcurrentHashMap<String, AtomicLong> sequenceCounters = new ConcurrentHashMap<>();

    public ResponseGenerator(ResponseRuleRepository ruleRepository) {
        this.ruleRepository = ruleRepository;
    }

    /**
     * 응답 필드값 생성
     *
     * @param telegramId    전문코드
     * @param requestFields 수신 전문 파싱 결과 (fieldName → value)
     * @return 응답 필드값 맵 (fieldName → value)
     */
    public Map<String, String> generateResponseFields(String telegramId, Map<String, String> requestFields) {
        List<ResponseRule> rules = ruleRepository.findByTelegramIdAndActiveTrueOrderBySortOrderAsc(telegramId);

        if (rules.isEmpty()) {
            log.warn("전문코드 [{}]에 대한 응답 규칙이 없습니다.", telegramId);
            return new LinkedHashMap<>(requestFields); // 규칙 없으면 에코백
        }

        Map<String, String> responseFields = new LinkedHashMap<>(requestFields);

        for (ResponseRule rule : rules) {
            String fieldName = rule.getFieldName();
            String value = generateFieldValue(rule, requestFields);
            if (value != null) {
                responseFields.put(fieldName, value);
            }
        }

        return responseFields;
    }

    /**
     * 개별 필드 규칙에 따라 값 생성
     */
    private String generateFieldValue(ResponseRule rule, Map<String, String> requestFields) {
        try {
            switch (rule.getRuleType()) {
                case FIXED:
                    return rule.getFixedValue() != null ? rule.getFixedValue() : "";

                case ECHO:
                    return requestFields.getOrDefault(rule.getFieldName(), "");

                case ECHO_FROM:
                    String sourceField = rule.getSourceField();
                    if (sourceField == null || sourceField.isEmpty()) {
                        log.warn("ECHO_FROM 규칙에 sourceField가 없습니다: {}", rule.getFieldName());
                        return "";
                    }
                    return requestFields.getOrDefault(sourceField, "");

                case TIMESTAMP:
                    String format = rule.getTimeFormat();
                    if (format == null || format.isEmpty()) {
                        format = "yyyyMMddHHmmss";
                    }
                    return LocalDateTime.now().format(DateTimeFormatter.ofPattern(format));

                case SEQUENCE:
                    return generateSequence(rule);

                case DEFAULT:
                default:
                    return null; // null이면 기존값 유지
            }
        } catch (Exception e) {
            log.error("필드값 생성 실패 [{}]: {}", rule.getFieldName(), e.getMessage());
            return "";
        }
    }

    /**
     * 시퀀스 번호 생성
     */
    private String generateSequence(ResponseRule rule) {
        String key = rule.getTelegramId() + ":" + rule.getFieldName();
        AtomicLong counter = sequenceCounters.computeIfAbsent(key, k -> new AtomicLong(0));
        long seq = counter.incrementAndGet();

        String prefix = rule.getSeqPrefix() != null ? rule.getSeqPrefix() : "";
        return prefix + String.format("%010d", seq);
    }

    /**
     * 시퀀스 카운터 리셋
     */
    public void resetSequence(String telegramId, String fieldName) {
        String key = telegramId + ":" + fieldName;
        sequenceCounters.remove(key);
    }

    /**
     * 전체 시퀀스 카운터 리셋
     */
    public void resetAllSequences() {
        sequenceCounters.clear();
    }
}
