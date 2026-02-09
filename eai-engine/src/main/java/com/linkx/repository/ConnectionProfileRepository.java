package com.linkx.repository;

import com.linkx.domain.ConnectionProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConnectionProfileRepository extends JpaRepository<ConnectionProfile, Long> {
    List<ConnectionProfile> findByEnv(String env);
    List<ConnectionProfile> findByProtocol(String protocol);
    List<ConnectionProfile> findByActiveTrue();
}
