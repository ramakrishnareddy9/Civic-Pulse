CREATE TABLE sla_policies (
    id                  BIGSERIAL PRIMARY KEY,
    category            VARCHAR(50)     NOT NULL,
    priority            VARCHAR(20)     NOT NULL,
    resolution_hours    INT             NOT NULL DEFAULT 48,
    escalation_hours    INT             NOT NULL DEFAULT 72,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    UNIQUE(category, priority)
);

CREATE INDEX idx_sla_category_priority ON sla_policies(category, priority);
