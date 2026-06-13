-- Password reset tokens table for email-based password recovery
CREATE TABLE password_reset_tokens (
    token           VARCHAR(255)    PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at      TIMESTAMP       NOT NULL,
    used            BOOLEAN         NOT NULL DEFAULT FALSE,
    used_at         TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Index for finding non-expired, unused tokens by user
CREATE INDEX idx_password_reset_tokens_user_id 
    ON password_reset_tokens(user_id) 
    WHERE used = false AND expires_at > NOW();

-- Index for cleanup: find expired tokens
CREATE INDEX idx_password_reset_tokens_expires_at 
    ON password_reset_tokens(expires_at);
