package com.roleready.jdanalysis;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class JdAnalysisController {

    private final JdAnalysisService jdAnalysisService;

    @PostMapping
    public ResponseEntity<JdSubmitResponse> submit(
            @AuthenticationPrincipal UUID userId,
            @RequestBody JdSubmitRequest request) {
        JdSubmitResponse response = jdAnalysisService.submitAnalysis(userId, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }
}
