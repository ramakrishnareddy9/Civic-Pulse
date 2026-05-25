CREATE TABLE complaints (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(255)    NOT NULL,
    description     TEXT,
    category        VARCHAR(50),
    status          VARCHAR(30)     NOT NULL DEFAULT 'OPEN',
    priority        VARCHAR(20)     NOT NULL DEFAULT 'MEDIUM',
    latitude        DECIMAL(10,8),
    longitude       DECIMAL(11,8),
    address         TEXT,
    ward_id         BIGINT          REFERENCES wards(id),
    citizen_id      BIGINT          NOT NULL REFERENCES users(id),
    officer_id      BIGINT          REFERENCES officers(id),
    department_id   BIGINT          REFERENCES departments(id),
    sla_deadline    TIMESTAMP,
    resolved_at     TIMESTAMP,
    officer_notes   TEXT,
    ai_category     VARCHAR(50),
    ai_priority     VARCHAR(20),
    ai_department   VARCHAR(255),
    ai_reason       TEXT,
    sentiment_score DECIMAL(5,2),
    is_deleted      BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE complaint_images (
    id              BIGSERIAL PRIMARY KEY,
    complaint_id    BIGINT          NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    file_name       VARCHAR(512)    NOT NULL,
    file_url        VARCHAR(1024)   NOT NULL,
    content_type    VARCHAR(100),
    file_size       BIGINT,
    uploaded_at     TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE escalation_logs (
    id              BIGSERIAL PRIMARY KEY,
    complaint_id    BIGINT          NOT NULL REFERENCES complaints(id),
    from_officer_id BIGINT          REFERENCES officers(id),
    to_officer_id   BIGINT          REFERENCES officers(id),
    reason          TEXT,
    escalated_at    TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaints_status        ON complaints(status);
CREATE INDEX idx_complaints_category      ON complaints(category);
CREATE INDEX idx_complaints_ward_id       ON complaints(ward_id);
CREATE INDEX idx_complaints_citizen_id    ON complaints(citizen_id);
CREATE INDEX idx_complaints_officer_id    ON complaints(officer_id);
CREATE INDEX idx_complaints_sla_deadline  ON complaints(sla_deadline);
CREATE INDEX idx_complaints_created_at    ON complaints(created_at);
CREATE INDEX idx_complaints_is_deleted    ON complaints(is_deleted);
