-- Seed departments
INSERT INTO departments (name, code, description, head_email) VALUES
('Public Works Department',     'PWD',   'Roads, bridges, public infrastructure',       'pwd@civicpulse.gov.in'),
('Water Supply Board',          'WSB',   'Water supply and sanitation',                 'wsb@civicpulse.gov.in'),
('Electricity Department',      'ELEC',  'Power supply and street lighting',            'elec@civicpulse.gov.in'),
('Sanitation Department',       'SANIT', 'Garbage collection and cleaning',             'sanit@civicpulse.gov.in'),
('Drainage Department',         'DRAIN', 'Storm water drainage and sewage',             'drain@civicpulse.gov.in'),
('Noise Pollution Control',     'NOISE', 'Noise complaints and pollution control',      'noise@civicpulse.gov.in'),
('General Administration',      'ADMIN', 'General civic issues and administration',     'admin@civicpulse.gov.in')
ON CONFLICT (code) DO NOTHING;

-- Seed wards
INSERT INTO wards (name, code, city, state, latitude, longitude) VALUES
('Ward 1 - Koramangala',   'W001', 'Bengaluru', 'Karnataka', 12.9352, 77.6245),
('Ward 2 - Indiranagar',   'W002', 'Bengaluru', 'Karnataka', 12.9784, 77.6408),
('Ward 3 - Whitefield',    'W003', 'Bengaluru', 'Karnataka', 12.9698, 77.7500),
('Ward 4 - Jayanagar',     'W004', 'Bengaluru', 'Karnataka', 12.9250, 77.5938),
('Ward 5 - Malleshwaram',  'W005', 'Bengaluru', 'Karnataka', 13.0035, 77.5728)
ON CONFLICT (code) DO NOTHING;

-- Seed SLA policies
INSERT INTO sla_policies (category, priority, resolution_hours, escalation_hours) VALUES
('ROAD',        'CRITICAL', 4,   8),
('ROAD',        'HIGH',     12,  24),
('ROAD',        'MEDIUM',   48,  72),
('ROAD',        'LOW',      120, 168),
('WATER',       'CRITICAL', 4,   8),
('WATER',       'HIGH',     8,   16),
('WATER',       'MEDIUM',   24,  48),
('WATER',       'LOW',      72,  96),
('ELECTRICITY', 'CRITICAL', 2,   4),
('ELECTRICITY', 'HIGH',     6,   12),
('ELECTRICITY', 'MEDIUM',   24,  48),
('ELECTRICITY', 'LOW',      72,  96),
('SANITATION',  'CRITICAL', 4,   8),
('SANITATION',  'HIGH',     12,  24),
('SANITATION',  'MEDIUM',   48,  72),
('SANITATION',  'LOW',      96,  120),
('DRAINAGE',    'CRITICAL', 4,   8),
('DRAINAGE',    'HIGH',     12,  24),
('DRAINAGE',    'MEDIUM',   48,  72),
('DRAINAGE',    'LOW',      96,  120),
('NOISE',       'CRITICAL', 2,   4),
('NOISE',       'HIGH',     8,   16),
('NOISE',       'MEDIUM',   24,  48),
('NOISE',       'LOW',      72,  96),
('OTHER',       'CRITICAL', 8,   16),
('OTHER',       'HIGH',     24,  48),
('OTHER',       'MEDIUM',   72,  96),
('OTHER',       'LOW',      120, 168)
ON CONFLICT (category, priority) DO NOTHING;
