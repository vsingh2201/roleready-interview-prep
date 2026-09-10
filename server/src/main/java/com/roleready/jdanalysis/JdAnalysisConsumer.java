package com.roleready.jdanalysis;

import java.util.List;
import java.util.UUID;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roleready.notification.SseEmitterRegistry;
import com.roleready.prepplan.PrepPlan;
import com.roleready.prepplan.PrepPlanService;
import com.roleready.rag.Question;
import com.roleready.rag.RagRetrievalService;
import com.roleready.user.Resume;
import com.roleready.user.ResumeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class JdAnalysisConsumer {

    private final ObjectMapper objectMapper;
    private final RagRetrievalService ragRetrievalService;
    private final PrepPlanService prepPlanService;
    private final SseEmitterRegistry sseEmitterRegistry;
    private final ResumeRepository resumeRepository;

    @KafkaListener(topics = KafkaTopics.JD_SUBMITTED, groupId = "jd-analysis-group")
    public void consume(String message) throws Exception {
        JsonNode payload = objectMapper.readTree(message);
        String analysisId = payload.path("analysisId").asText();
        String userId = payload.path("userId").asText();
        String jdText = payload.path("jdText").asText();
        String resumeId = payload.hasNonNull("resumeId") ? payload.get("resumeId").asText() : null;

        log.info("Received JD for analysis: analysisId={}, userId={}", analysisId, userId);

        sseEmitterRegistry.send(analysisId, "kafka_published", "JD received");

        List<String> extractedSkills;
        String resumeText = null;

        if (resumeId != null) {
            Resume resume = resumeRepository.findById(UUID.fromString(resumeId))
                    .orElseThrow(() -> new IllegalStateException("Resume not found: " + resumeId));
            extractedSkills = objectMapper.readValue(resume.getParsedSkills(), new TypeReference<List<String>>() {});
            resumeText = resume.getExtractedText();
        } else {
            extractedSkills = prepPlanService.extractSkillsFromJd(jdText);
        }

        sseEmitterRegistry.send(analysisId, "skills_extracted", extractedSkills.size() + " skills identified");

        List<Question> questions = ragRetrievalService.retrieve(jdText, extractedSkills);
        log.info("RAG retrieved {} questions for analysisId={}", questions.size(), analysisId);

        sseEmitterRegistry.send(analysisId, "rag_retrieved", questions.size() + " questions retrieved");

        PrepPlan prepPlan = prepPlanService.generate(
                UUID.fromString(analysisId), UUID.fromString(userId), jdText, questions, resumeText);

        sseEmitterRegistry.send(analysisId, "plan_generated", prepPlan.getId().toString());
        log.info("Prep plan generated and pushed via SSE for analysisId={}", analysisId);
    }
}
