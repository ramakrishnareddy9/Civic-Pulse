CREATE TABLE officers (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES users(id),
    department_id   BIGINT       REFERENCES departments(id),
    ward_id         BIGINT       REFERENCES wards(id),
    badge_number    VARCHAR(50),
    designation     VARCHAR(255),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_officers_user_id       ON officers(user_id);
CREATE INDEX idx_officers_department_id ON officers(department_id);
CREATE INDEX idx_officers_ward_id       ON officers(ward_id);
