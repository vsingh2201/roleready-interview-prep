package com.roleready.jdanalysis;

import java.util.List;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roleready.rag.Question;
import com.roleready.rag.RagRetrievalService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class JdAnalysisConsumer {

    private final ObjectMapper objectMapper;
    private final RagRetrievalService ragRetrievalService;

    @KafkaListener(topics = KafkaTopics.JD_SUBMITTED, groupId = "jd-analysis-group")
    public void consume(String message) throws Exception {
        JsonNode payload = objectMapper.readTree(message);
        String analysisId = payload.path("analysisId").asText();
        String userId = payload.path("userId").asText();
        String jdText = payload.path("jdText").asText();

        log.info("Received JD for analysis: analysisId={}, userId={}", analysisId, userId);

        List<Question> questions = ragRetrievalService.retrieve(jdText, List.of("kafka", "postgresql", "java"));
        log.info("RAG retrieved {} questions for analysisId={}", questions.size(), analysisId);
    }
}
