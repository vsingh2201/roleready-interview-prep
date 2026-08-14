CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  topic VARCHAR(100),
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy','medium','hard')),
  source VARCHAR(200),
  embedding vector(768),
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS questions_embedding_idx
  ON questions USING hnsw (embedding vector_cosine_ops);
