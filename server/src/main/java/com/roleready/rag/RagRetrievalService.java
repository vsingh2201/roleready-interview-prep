package com.roleready.rag;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RagRetrievalService {

    private static final int RESULTS_PER_SKILL = 10;
    private static final int TOP_N = 10;

    private final GeminiEmbeddingService geminiEmbeddingService;
    private final QuestionRepository questionRepository;

    public List<Question> retrieve(String jdText, List<String> extractedSkills) {
        Map<UUID, Question> deduped = new LinkedHashMap<>();

        for (String skill : extractedSkills) {
            float[] embedding = geminiEmbeddingService.embed(skill);
            String embeddingLiteral = QuestionEmbeddingConverter.toLiteral(embedding);

            List<Question> matches = questionRepository.hybridSearch(skill, null, embeddingLiteral, RESULTS_PER_SKILL);
            for (Question question : matches) {
                deduped.putIfAbsent(question.getId(), question);
            }
        }

        return deduped.values().stream()
                .limit(TOP_N)
                .collect(Collectors.toList());
    }
}
