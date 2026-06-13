-- V14: Database index enhancements and pgvector configuration
-- Composite index for officer workload queue (findByOfficerIdAndIsDeletedFalse queries)
-- This improves performance on the officer dashboard complaint list page
CREATE INDEX IF NOT EXISTS idx_complaints_officer_is_deleted 
    ON complaints(officer_id, is_deleted) 
    WHERE is_deleted = false;

-- Ensure vector index is optimized for cosine similarity searches
-- Used by Spring AI VectorStore for RAG complaint enrichment
-- NOTE: Requires pgvector extension to be installed
-- Docker setup: Use pgvector/pgvector:pg16 image with pgvector pre-installed
ALTER INDEX IF EXISTS idx_vector_store_embedding
    SET (lists = 100);
