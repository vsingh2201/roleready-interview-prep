package com.roleready.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ResumeRepository extends JpaRepository<Resume, UUID> {

    List<Resume> findByUserId(UUID userId);

    Optional<Resume> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);
}
