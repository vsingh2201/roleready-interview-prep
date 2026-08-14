package com.roleready.rag;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class CorpusIngestionRunner implements CommandLineRunner {

    private static final String SAMPLE_SOURCE = "sample-corpus-v1";

    private record SampleQuestion(String text, String topic, String difficulty) {
    }

    private static final List<SampleQuestion> SAMPLE_QUESTIONS = List.of(
            new SampleQuestion(
                    "What is the role of a Kafka partition and how does it affect message ordering?",
                    "kafka", "easy"),
            new SampleQuestion(
                    "Explain the difference between at-least-once and exactly-once delivery semantics in Kafka.",
                    "kafka", "medium"),
            new SampleQuestion(
                    "How would you design a Kafka consumer group to handle rebalancing without losing message order?",
                    "kafka", "hard"),
            new SampleQuestion(
                    "What is the purpose of an index in PostgreSQL and when might it hurt write performance?",
                    "postgresql", "easy"),
            new SampleQuestion(
                    "How does PostgreSQL's MVCC model handle concurrent transactions?",
                    "postgresql", "hard"),
            new SampleQuestion(
                    "Design a URL shortening service that can handle 100 million requests per day.",
                    "system-design", "medium"),
            new SampleQuestion(
                    "How would you design a rate limiter for a public API?",
                    "system-design", "hard"),
            new SampleQuestion(
                    "What is the difference between an abstract class and an interface in Java?",
                    "java", "easy"),
            new SampleQuestion(
                    "Explain how the Java garbage collector decides when to run a minor vs major collection.",
                    "java", "medium"),
            new SampleQuestion(
                    "Tell me about a time you disagreed with a teammate's technical decision and how you resolved it.",
                    "behavioural", "easy"));

    private final QuestionRepository questionRepository;
    private final CorpusIngestionService corpusIngestionService;

    @Override
    public void run(String... args) {
        if (questionRepository.count() > 0) {
            log.info("Question corpus already populated, skipping sample ingestion");
            return;
        }

        log.info("Ingesting {} sample questions into the corpus", SAMPLE_QUESTIONS.size());
        try {
            for (SampleQuestion sample : SAMPLE_QUESTIONS) {
                corpusIngestionService.ingestQuestion(sample.text(), sample.topic(), sample.difficulty(), SAMPLE_SOURCE);
            }
        } catch (Exception e) {
            log.error("Corpus ingestion failed: {}", e.getMessage());
        }
    }
}
