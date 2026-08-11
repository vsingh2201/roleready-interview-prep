package com.roleready.jdanalysis;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class JdAnalysisConsumer {

    private final ObjectMapper objectMapper;

    @KafkaListener(topics = KafkaTopics.JD_SUBMITTED, groupId = "jd-analysis-group")
    public void consume(String message) throws Exception {
        JsonNode payload = objectMapper.readTree(message);
        String analysisId = payload.path("analysisId").asText();
        String userId = payload.path("userId").asText();

        log.info("Received JD for analysis: analysisId={}, userId={}", analysisId, userId);
        // TODO: Step 4 - call Gemini to extract skills and publish to skill-gaps-ready
    }
}
