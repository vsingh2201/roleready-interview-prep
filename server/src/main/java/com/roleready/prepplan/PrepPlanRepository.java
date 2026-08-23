package com.roleready.prepplan;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PrepPlanRepository extends JpaRepository<PrepPlan, UUID> {

    Optional<PrepPlan> findByAnalysisId(UUID analysisId);
}
