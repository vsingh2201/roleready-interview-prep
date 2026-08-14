package com.roleready.rag;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "topic", length = 100)
    private String topic;

    @Column(name = "difficulty", length = 20)
    private String difficulty;

    @Column(name = "source", length = 200)
    private String source;

    @Column(name = "embedding", columnDefinition = "vector(768)")
    private String embeddingStr;

    @Transient
    private float[] embedding;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        syncEmbeddingStr();
    }

    @PreUpdate
    protected void onUpdate() {
        syncEmbeddingStr();
    }

    @PostLoad
    protected void onLoad() {
        if (embeddingStr != null) {
            this.embedding = QuestionEmbeddingConverter.fromLiteral(embeddingStr);
        }
    }

    private void syncEmbeddingStr() {
        if (embedding != null) {
            this.embeddingStr = QuestionEmbeddingConverter.toLiteral(embedding);
        }
    }
}
