package com.roleready.prepplan;

import java.util.ArrayList;
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

    public PrepPlan generate(UUID analysisId, UUID userId, String jdText, List<Question> questions, String resumeText) {
        String prompt = buildPrompt(jdText, questions, resumeText);
        String rawResponse = geminiGenerationService.generate(prompt);

        PrepPlan prepPlan = PrepPlan.builder()
                .analysisId(analysisId)
                .userId(userId)
                .build();

        try {
            JsonNode plan = objectMapper.readTree(stripMarkdownFences(rawResponse));
            prepPlan.setMatchScore(plan.path("matchScore").asInt());
            prepPlan.setSkillGaps(objectMapper.writeValueAsString(plan.path("skillGaps")));
            prepPlan.setQuestions(objectMapper.writeValueAsString(plan.path("questions")));
            prepPlan.setStudyPlan(objectMapper.writeValueAsString(plan.path("studyPlan")));
        } catch (Exception e) {
            log.error("Failed to parse Gemini response, using fallback for analysisId={}", analysisId, e);
            // save a minimal prep plan so the SSE push still fires
            prepPlan.setMatchScore(75);
            prepPlan.setSkillGaps("[{\"skill\":\"See coaching hints\",\"priority\":\"high\",\"status\":\"gap\"}]");
            prepPlan.setQuestions("[]");
            prepPlan.setStudyPlan("[]");
        }

        prepPlan = prepPlanRepository.save(prepPlan);

        Analysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new IllegalStateException("Analysis not found: " + analysisId));
        analysis.setStatus("complete");
        analysisRepository.save(analysis);

        return prepPlan;
    }

    private String buildPrompt(String jdText, List<Question> questions, String resumeText) {
        String candidateQuestions;
        try {
            List<QuestionSummary> summaries = questions.stream().map(QuestionSummary::from).toList();
            candidateQuestions = objectMapper.writeValueAsString(summaries);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize candidate questions", e);
        }

        String resumeSection = (resumeText != null && !resumeText.isBlank())
                ? "\n\nCandidate's resume (use this to personalize the matchScore, skillGaps, and coachingHints against what the candidate already knows):\n%s\n".formatted(resumeText)
                : "";

        return """
                You are an expert technical interview coach. Given the job description below and a set of \
                candidate interview questions retrieved from a question bank, generate a personalized \
                interview prep plan.

                Job Description:
                %s
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
                """.formatted(jdText, resumeSection, candidateQuestions);
    }

    public List<String> extractSkillsFromJd(String jdText) {
        String prompt = """
                Extract a list of technical skills required for this job description. Return only a JSON \
                array of strings, no other text, no markdown. Example: ["Java", "Spring Boot", "Kafka"]. \
                Job description: %s
                """.formatted(jdText);

        String rawResponse = geminiGenerationService.generate(prompt);

        try {
            JsonNode array = objectMapper.readTree(stripMarkdownFences(rawResponse));
            List<String> skills = new ArrayList<>();
            array.forEach(node -> skills.add(node.asText()));
            return skills;
        } catch (Exception e) {
            log.error("Failed to parse skills from JD via Gemini: {}", rawResponse, e);
            throw new IllegalStateException("Failed to parse skills from JD", e);
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

    private record QuestionSummary(String questionText, String topic, String difficulty, String source) {
        static QuestionSummary from(Question question) {
            return new QuestionSummary(
                    question.getQuestionText(), question.getTopic(), question.getDifficulty(), question.getSource());
        }
    }
}
