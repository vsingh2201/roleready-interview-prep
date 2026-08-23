package com.roleready.prepplan;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roleready.jdanalysis.Analysis;
import com.roleready.jdanalysis.AnalysisRepository;
import com.roleready.rag.Question;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrepPlanService {

    private final GeminiGenerationService geminiGenerationService;
    private final PrepPlanRepository prepPlanRepository;
    private final AnalysisRepository analysisRepository;
    private final ObjectMapper objectMapper;

    public PrepPlan generate(UUID analysisId, UUID userId, String jdText, List<Question> questions) {
        String prompt = buildPrompt(jdText, questions);
        String rawResponse = geminiGenerationService.generate(prompt);

        JsonNode plan;
        try {
            plan = objectMapper.readTree(stripMarkdownFences(rawResponse));
        } catch (Exception e) {
            log.error("Failed to parse Gemini prep plan response for analysisId={}: {}", analysisId, rawResponse, e);
            throw new IllegalStateException("Failed to parse Gemini prep plan response", e);
        }

        PrepPlan prepPlan;
        try {
            prepPlan = PrepPlan.builder()
                    .analysisId(analysisId)
                    .userId(userId)
                    .matchScore(plan.path("matchScore").asInt())
                    .skillGaps(objectMapper.writeValueAsString(plan.path("skillGaps")))
                    .questions(objectMapper.writeValueAsString(plan.path("questions")))
                    .studyPlan(objectMapper.writeValueAsString(plan.path("studyPlan")))
                    .build();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize prep plan fields", e);
        }

        prepPlan = prepPlanRepository.save(prepPlan);

        Analysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new IllegalStateException("Analysis not found: " + analysisId));
        analysis.setStatus("complete");
        analysisRepository.save(analysis);

        return prepPlan;
    }

    private String buildPrompt(String jdText, List<Question> questions) {
        String candidateQuestions;
        try {
            List<QuestionSummary> summaries = questions.stream().map(QuestionSummary::from).toList();
            candidateQuestions = objectMapper.writeValueAsString(summaries);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize candidate questions", e);
        }

        return """
                You are an expert technical interview coach. Given the job description below and a set of \
                candidate interview questions retrieved from a question bank, generate a personalized \
                interview prep plan.

                Job Description:
                %s

                Candidate questions retrieved from the question bank (select and adapt the most relevant \
                ones; for each chosen question add a similarityScore between 0 and 1 and a coachingHint):
                %s

                Return ONLY valid JSON, with no markdown formatting and no code fences, matching exactly \
                this structure:
                {
                  "matchScore": 84,
                  "skillGaps": [
                    {"skill": "Kafka internals", "priority": "high", "status": "gap"},
                    {"skill": "PostgreSQL tuning", "priority": "medium", "status": "partial"}
                  ],
                  "questions": [
                    {"questionText": "...", "topic": "kafka", "difficulty": "hard", "similarityScore": 0.91, "source": "sample-corpus-v1", "coachingHint": "Focus on exactly-once semantics..."}
                  ],
                  "studyPlan": [
                    {"week": 1, "title": "Kafka deep dive", "description": "Consumer groups, offset management, exactly-once semantics"},
                    {"week": 2, "title": "Payments & databases", "description": "Distributed transactions, PostgreSQL tuning"},
                    {"week": 3, "title": "Mock interviews", "description": "System design drills, STAR method, live coding"}
                  ]
                }
                """.formatted(jdText, candidateQuestions);
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

    private record QuestionSummary(String questionText, String topic, String difficulty, String source) {
        static QuestionSummary from(Question question) {
            return new QuestionSummary(
                    question.getQuestionText(), question.getTopic(), question.getDifficulty(), question.getSource());
        }
    }
}
