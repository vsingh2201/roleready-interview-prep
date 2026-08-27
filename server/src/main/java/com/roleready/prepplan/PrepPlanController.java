package com.roleready.prepplan;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/prep-plan")
@RequiredArgsConstructor
public class PrepPlanController {

    private final PrepPlanRepository prepPlanRepository;

    @GetMapping("/{analysisId}")
    public ResponseEntity<PrepPlan> getByAnalysisId(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID analysisId) {
        return prepPlanRepository.findByAnalysisId(analysisId)
                .filter(prepPlan -> prepPlan.getUserId().equals(userId))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
