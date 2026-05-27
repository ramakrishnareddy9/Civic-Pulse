-- Add citizen_approved flag to complaints
ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS citizen_approved boolean DEFAULT false;

-- Add index to speed up searches for pending citizen approvals
CREATE INDEX IF NOT EXISTS idx_complaints_resolved_at_citizen_approved ON complaints(resolved_at) WHERE citizen_approved = false;

-- No-op: ensure officer workload queries perform well
CREATE INDEX IF NOT EXISTS idx_complaints_officer_status ON complaints(officer_id, status) ;
