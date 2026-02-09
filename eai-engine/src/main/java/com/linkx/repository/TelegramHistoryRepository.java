package com.linkx.repository;

import com.linkx.domain.TelegramHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TelegramHistoryRepository extends JpaRepository<TelegramHistory, Long> {

    Page<TelegramHistory> findByTelegramIdOrderByCreatedAtDesc(String telegramId, Pageable pageable);

    List<TelegramHistory> findTop20ByOrderByCreatedAtDesc();

    Page<TelegramHistory> findByProtocolOrderByCreatedAtDesc(String protocol, Pageable pageable);
}
