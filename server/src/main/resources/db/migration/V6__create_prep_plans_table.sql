CREATE TABLE IF NOT EXISTS prep_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id),
  user_id UUID NOT NULL REFERENCES users(id),
  match_score INTEGER,
  skill_gaps TEXT NOT NULL,
  questions TEXT NOT NULL,
  study_plan TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prep_plans_analysis_id_idx ON prep_plans (analysis_id);
CREATE INDEX IF NOT EXISTS prep_plans_user_id_idx ON prep_plans (user_id);
