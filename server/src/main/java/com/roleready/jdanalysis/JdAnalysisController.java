package com.roleready.jdanalysis;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class JdAnalysisController {

    private final JdAnalysisService jdAnalysisService;
    private final AnalysisRepository analysisRepository;
    private final SkillExtractionService skillExtractionService;

    @PostMapping("/api/analysis")
    public ResponseEntity<JdSubmitResponse> submit(
            @AuthenticationPrincipal UUID userId,
            @RequestBody JdSubmitRequest request) {
        JdSubmitResponse response = jdAnalysisService.submitAnalysis(userId, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/api/analysis/{analysisId}")
    public ResponseEntity<Analysis> get(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID analysisId) {
        return analysisRepository.findById(analysisId)
                .filter(analysis -> analysis.getUserId().equals(userId))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/api/skills/extract")
    public ResponseEntity<SkillExtractResponse> extractSkills(
            @AuthenticationPrincipal UUID userId,
            @RequestBody SkillExtractRequest request) {
        List<String> skills = skillExtractionService.extractSkills(request.getJdText());
        return ResponseEntity.ok(new SkillExtractResponse(skills));
    }
}
