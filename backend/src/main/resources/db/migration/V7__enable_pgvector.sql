-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Vector store for RAG chatbot (Spring AI managed table)
CREATE TABLE IF NOT EXISTS vector_store (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    content     TEXT,
    metadata    JSONB,
    embedding   vector(1536)
);

CREATE INDEX IF NOT EXISTS idx_vector_store_embedding
    ON vector_store USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- AI Insights table
CREATE TABLE ai_insights (
    id              BIGSERIAL PRIMARY KEY,
    ward_id         BIGINT          REFERENCES wards(id),
    insight_type    VARCHAR(50)     NOT NULL,
    content         TEXT            NOT NULL,
    generated_at    TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_ward_id       ON ai_insights(ward_id);
CREATE INDEX idx_ai_insights_generated_at  ON ai_insights(generated_at);
