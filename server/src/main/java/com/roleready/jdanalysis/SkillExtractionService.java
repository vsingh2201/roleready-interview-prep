package com.roleready.jdanalysis;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roleready.prepplan.GeminiGenerationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillExtractionService {

    private final GeminiGenerationService geminiGenerationService;
    private final ObjectMapper objectMapper;

    public List<String> extractSkills(String jdText) {
        String prompt = """
                Extract a list of technical skills from this job description. Return only a JSON array of \
                strings, no markdown. Job description: %s
                """.formatted(jdText);

        String rawResponse = geminiGenerationService.generate(prompt);

        try {
            JsonNode array = objectMapper.readTree(stripMarkdownFences(rawResponse));
            List<String> skills = new ArrayList<>();
            array.forEach(node -> skills.add(node.asText()));
            return skills;
        } catch (Exception e) {
            log.error("Failed to parse skills from Gemini response: {}", rawResponse, e);
            throw new IllegalStateException("Failed to extract skills from job description", e);
        }
    }

    private String stripMarkdownFences(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```[a-zA-Z]*\\s*", "");
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
        }
        return trimmed.trim();
    }
}
