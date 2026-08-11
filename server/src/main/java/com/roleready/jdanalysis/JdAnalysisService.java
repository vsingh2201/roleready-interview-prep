package com.roleready.jdanalysis;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class JdAnalysisService {

    private final AnalysisRepository analysisRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public JdSubmitResponse submitAnalysis(UUID userId, JdSubmitRequest request) {
        UUID analysisId = UUID.randomUUID();

        Analysis analysis = Analysis.builder()
                .id(analysisId)
                .userId(userId)
                .jdText(request.getJdText())
                .status("processing")
                .build();
        analysisRepository.save(analysis);

        publishJdSubmitted(analysisId, userId, request);

        return new JdSubmitResponse(analysisId);
    }

    private void publishJdSubmitted(UUID analysisId, UUID userId, JdSubmitRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("analysisId", analysisId.toString());
        payload.put("userId", userId.toString());
        payload.put("jdText", request.getJdText());
        payload.put("resumeId", request.getResumeId());

        try {
            String json = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(KafkaTopics.JD_SUBMITTED, analysisId.toString(), json);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize jd-submitted payload for analysisId={}", analysisId, e);
            throw new IllegalStateException("Failed to publish jd-submitted event", e);
        }
    }
}
