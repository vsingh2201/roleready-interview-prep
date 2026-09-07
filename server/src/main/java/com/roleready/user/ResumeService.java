package com.roleready.user;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roleready.prepplan.GeminiGenerationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeService {

    private final GeminiGenerationService geminiGenerationService;
    private final ResumeRepository resumeRepository;
    private final ObjectMapper objectMapper;

    public String extractText(byte[] pdfBytes) {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            return new PDFTextStripper().getText(document);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to extract text from PDF", e);
        }
    }

    public List<String> parseSkills(String resumeText) {
        String prompt = """
                Extract a list of technical skills from this resume text. Return only a JSON array of \
                strings, no other text, no markdown. Example: ["Java", "Spring Boot", "Kafka"]. Resume text: %s
                """.formatted(resumeText);

        String rawResponse = geminiGenerationService.generate(prompt);

        try {
            JsonNode array = objectMapper.readTree(stripMarkdownFences(rawResponse));
            List<String> skills = new ArrayList<>();
            array.forEach(node -> skills.add(node.asText()));
            return skills;
        } catch (Exception e) {
            log.error("Failed to parse skills from Gemini response: {}", rawResponse, e);
            throw new IllegalStateException("Failed to parse skills from resume", e);
        }
    }

    public Resume saveResume(UUID userId, String fileName, byte[] pdfBytes) {
        String extractedText = extractText(pdfBytes);
        List<String> skills = parseSkills(extractedText);

        String parsedSkillsJson;
        try {
            parsedSkillsJson = objectMapper.writeValueAsString(skills);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize parsed skills", e);
        }

        Resume resume = Resume.builder()
                .userId(userId)
                .fileName(fileName)
                .extractedText(extractedText)
                .parsedSkills(parsedSkillsJson)
                .build();

        return resumeRepository.save(resume);
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
