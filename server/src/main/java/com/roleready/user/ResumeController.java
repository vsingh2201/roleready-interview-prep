package com.roleready.user;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final ResumeRepository resumeRepository;
    private final ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> upload(
            @AuthenticationPrincipal UUID userId,
            @RequestParam("file") MultipartFile file) throws IOException {
        Resume resume = resumeService.saveResume(userId, file.getOriginalFilename(), file.getBytes());
        return ResponseEntity.ok(toResponse(resume));
    }

    @GetMapping("/latest")
    public ResponseEntity<Map<String, Object>> latest(@AuthenticationPrincipal UUID userId) {
        return resumeRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .map(resume -> ResponseEntity.ok(toResponse(resume)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private Map<String, Object> toResponse(Resume resume) {
        List<String> skills;
        try {
            skills = List.of(objectMapper.readValue(resume.getParsedSkills(), String[].class));
        } catch (Exception e) {
            skills = List.of();
        }
        return Map.of(
                "resumeId", resume.getId(),
                "fileName", resume.getFileName(),
                "parsedSkills", skills);
    }
}
