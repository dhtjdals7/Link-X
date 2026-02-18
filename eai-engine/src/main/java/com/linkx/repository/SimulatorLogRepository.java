package com.linkx.repository;

import com.linkx.domain.SimulatorLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SimulatorLogRepository extends JpaRepository<SimulatorLog, Long> {

    /** 최근 로그 조회 (최신순) */
    List<SimulatorLog> findTop50ByOrderByReceivedAtDesc();

    /** 설정 ID별 로그 조회 */
    List<SimulatorLog> findByConfigIdOrderByReceivedAtDesc(Long configId);

    /** 전문코드별 로그 조회 */
    List<SimulatorLog> findByTelegramIdOrderByReceivedAtDesc(String telegramId);

    /** 페이징 지원 */
    Page<SimulatorLog> findByConfigIdOrderByReceivedAtDesc(Long configId, Pageable pageable);
}
