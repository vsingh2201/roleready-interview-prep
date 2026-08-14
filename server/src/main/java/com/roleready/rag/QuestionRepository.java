package com.roleready.rag;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    @Query(value = """
            SELECT * FROM questions
            WHERE (:topic IS NULL OR topic = :topic)
            AND (:difficulty IS NULL OR difficulty = :difficulty)
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
            """, nativeQuery = true)
    List<Question> hybridSearch(
            @Param("topic") String topic,
            @Param("difficulty") String difficulty,
            @Param("embedding") String embedding,
            @Param("limit") int limit);
}
