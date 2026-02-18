package com.linkx.repository;

import com.linkx.domain.ResponseRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResponseRuleRepository extends JpaRepository<ResponseRule, Long> {

    /** 전문코드별 활성 규칙 조회 (정렬순) */
    List<ResponseRule> findByTelegramIdAndActiveTrueOrderBySortOrderAsc(String telegramId);

    /** 전문코드별 전체 규칙 조회 */
    List<ResponseRule> findByTelegramIdOrderBySortOrderAsc(String telegramId);

    /** 전문코드 + 필드명으로 규칙 조회 */
    ResponseRule findByTelegramIdAndFieldName(String telegramId, String fieldName);

    /** 응답 규칙이 존재하는 전문코드 목록 */
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT r.telegramId FROM ResponseRule r WHERE r.active = true")
    List<String> findDistinctActiveTelegramIds();

    /** 전문코드별 규칙 전체 삭제 */
    void deleteByTelegramId(String telegramId);
}
