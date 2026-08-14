ALTER TABLE questions DROP COLUMN IF EXISTS embedding;
ALTER TABLE questions ADD COLUMN embedding vector(768);
CREATE INDEX IF NOT EXISTS questions_embedding_idx
  ON questions USING hnsw (embedding vector_cosine_ops);
