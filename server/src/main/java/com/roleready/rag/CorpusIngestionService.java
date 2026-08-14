package com.roleready.rag;

import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CorpusIngestionService {

    private final GeminiEmbeddingService geminiEmbeddingService;
    private final JdbcTemplate jdbcTemplate;

    public void ingestQuestion(String questionText, String topic, String difficulty, String source) {
        float[] embedding = geminiEmbeddingService.embed(questionText);
        String embeddingLiteral = QuestionEmbeddingConverter.toLiteral(embedding);
        UUID id = UUID.randomUUID();

        jdbcTemplate.update(
                "INSERT INTO questions (id, question_text, topic, difficulty, source, embedding, created_at) "
                        + "VALUES (?, ?, ?, ?, ?, CAST(? AS vector), now())",
                id, questionText, topic, difficulty, source, embeddingLiteral);
    }
}
