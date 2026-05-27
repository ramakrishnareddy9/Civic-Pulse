-- V11: Add notifications table and satisfaction_rating column
-- Notifications table for real-time notification center
CREATE TABLE IF NOT EXISTS notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type        VARCHAR(50)   NOT NULL,
    title       VARCHAR(255)  NOT NULL,
    body        TEXT,
    is_read     BOOLEAN       NOT NULL DEFAULT FALSE,
    link        VARCHAR(500),
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications (user_id, is_read);

-- Satisfaction rating (1–5) for citizen-confirmed resolutions
ALTER TABLE complaints
    ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER
        CHECK (satisfaction_rating IS NULL OR (satisfaction_rating BETWEEN 1 AND 5));
