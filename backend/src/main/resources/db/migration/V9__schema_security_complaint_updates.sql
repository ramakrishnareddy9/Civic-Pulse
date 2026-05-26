ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS ward_id BIGINT REFERENCES wards(id);

UPDATE users
SET email_verified = TRUE
WHERE is_active = TRUE;

ALTER TABLE complaints
    ADD COLUMN IF NOT EXISTS incident_date DATE,
    ADD COLUMN IF NOT EXISTS incident_time TIME;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_sla_policies_category'
    ) THEN
        ALTER TABLE sla_policies
            ADD CONSTRAINT chk_sla_policies_category
            CHECK (category IN ('ROAD','WATER','ELECTRICITY','SANITATION','DRAINAGE','NOISE','OTHER'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_ward_id ON users(ward_id);
CREATE INDEX IF NOT EXISTS idx_complaints_ward_status_active
    ON complaints(ward_id, status)
    WHERE is_deleted = false;
