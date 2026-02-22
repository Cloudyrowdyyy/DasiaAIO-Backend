-- Requirement 3: Firearm Allocation with Authorization Checks

-- Extend firearm_allocations: add expected_return_date, notes, issued_by
ALTER TABLE firearm_allocations ADD COLUMN IF NOT EXISTS expected_return_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE firearm_allocations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE firearm_allocations ADD COLUMN IF NOT EXISTS issued_by VARCHAR(36);

-- Create firearm_maintenance table
CREATE TABLE IF NOT EXISTS firearm_maintenance (
    id VARCHAR(36) PRIMARY KEY,
    firearm_id VARCHAR(36) NOT NULL REFERENCES firearms(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100) NOT NULL,  -- 'inspection', 'repair', 'cleaning', 'calibration'
    description TEXT NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completion_date TIMESTAMP WITH TIME ZONE,
    performed_by VARCHAR(255),
    cost DECIMAL(10,2),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',  -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create training_records table
CREATE TABLE IF NOT EXISTS training_records (
    id VARCHAR(36) PRIMARY KEY,
    guard_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    training_type VARCHAR(100) NOT NULL,  -- 'firearms_handling', 'safety', 'qualification', 'advanced'
    completed_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    certificate_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'valid',  -- 'valid', 'expired', 'revoked'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_firearm_maintenance_firearm_id ON firearm_maintenance(firearm_id);
CREATE INDEX IF NOT EXISTS idx_firearm_maintenance_status ON firearm_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_firearm_maintenance_scheduled_date ON firearm_maintenance(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_training_records_guard_id ON training_records(guard_id);
CREATE INDEX IF NOT EXISTS idx_training_records_status ON training_records(status);
CREATE INDEX IF NOT EXISTS idx_firearm_allocations_status ON firearm_allocations(status);

-- Auto-expire permits that are past their expiry date
UPDATE guard_firearm_permits SET status = 'expired' WHERE expiry_date < CURRENT_TIMESTAMP AND status = 'active';
-- Auto-expire training records that are past their expiry date
UPDATE training_records SET status = 'expired' WHERE expiry_date < CURRENT_TIMESTAMP AND status = 'valid';
