package com.linkx.repository;

import com.linkx.domain.TelegramLayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TelegramLayoutRepository extends JpaRepository<TelegramLayout, Long> {

    /** 전문코드로 레이아웃 필드 목록 조회 (순번 정렬) */
    List<TelegramLayout> findByTelegramIdAndActiveTrueOrderByFieldSeq(String telegramId);

    /** 전문코드 목록 조회 (Distinct) */
    @Query("SELECT DISTINCT t.telegramId, t.telegramName FROM TelegramLayout t WHERE t.active = true ORDER BY t.telegramId")
    List<Object[]> findDistinctTelegrams();

    /** 섹션별 필드 조회 */
    List<TelegramLayout> findByTelegramIdAndSectionAndActiveTrueOrderByFieldSeq(
            String telegramId, String section);

    /** 전문코드 존재 여부 */
    boolean existsByTelegramId(String telegramId);

    List<TelegramLayout> findByTelegramIdOrderByFieldSeqAsc(String telegramId);

}
