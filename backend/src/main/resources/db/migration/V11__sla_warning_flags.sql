-- Add SLA warning sent flags to complaints so we don't spam reminders
ALTER TABLE complaints
    ADD COLUMN sla_warn_2h_sent boolean DEFAULT false NOT NULL,
    ADD COLUMN sla_warn_30m_sent boolean DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_complaints_sla_warn_2h ON complaints(sla_deadline) WHERE sla_warn_2h_sent = false;
CREATE INDEX IF NOT EXISTS idx_complaints_sla_warn_30m ON complaints(sla_deadline) WHERE sla_warn_30m_sent = false;
