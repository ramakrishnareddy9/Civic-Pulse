-- Audit log table for immutable change tracking
CREATE TABLE audit_logs (
    id              BIGSERIAL       PRIMARY KEY,
    entity_type     VARCHAR(50)     NOT NULL,
    entity_id       BIGINT          NOT NULL,
    action          VARCHAR(100)    NOT NULL,
    old_value       JSONB,
    new_value       JSONB,
    performed_by    BIGINT          NOT NULL REFERENCES users(id),
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(512),
    performed_at    TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_logs_entity 
    ON audit_logs(entity_type, entity_id, performed_at DESC);

CREATE INDEX idx_audit_logs_action 
    ON audit_logs(action, performed_at DESC);

CREATE INDEX idx_audit_logs_user 
    ON audit_logs(performed_by, performed_at DESC);

CREATE INDEX idx_audit_logs_performed_at 
    ON audit_logs(performed_at DESC);

-- Partial index for sensitive actions
CREATE INDEX idx_audit_logs_sensitive_actions 
    ON audit_logs(performed_at DESC)
    WHERE action IN ('DELETE_COMPLAINT', 'UPDATE_STATUS', 'REASSIGN_OFFICER', 'DELETE_DEPARTMENT', 'DELETE_OFFICER');
