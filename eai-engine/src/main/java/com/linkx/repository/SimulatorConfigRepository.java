package com.linkx.repository;

import com.linkx.domain.SimulatorConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SimulatorConfigRepository extends JpaRepository<SimulatorConfig, Long> {

    List<SimulatorConfig> findByActiveTrueOrderByPortAsc();

    Optional<SimulatorConfig> findByPort(int port);
}
