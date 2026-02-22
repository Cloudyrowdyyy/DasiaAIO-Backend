-- Create merit score tables for Requirement 2

-- Table: guard_merit_scores
-- Stores calculated merit scores for each guard
CREATE TABLE IF NOT EXISTS guard_merit_scores (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    guard_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    attendance_score DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0-100, based on check-in rate
    punctuality_score DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0-100, based on on-time arrivals
    client_rating DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0-100, from client evaluations
    overall_score DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Weighted average: attendance(30%) + punctuality(35%) + client_rating(35%)
    rank VARCHAR(50) DEFAULT 'Standard', -- Gold, Silver, Bronze, Standard (based on score ranges)
    total_shifts_completed INT DEFAULT 0,
    on_time_count INT DEFAULT 0,
    late_count INT DEFAULT 0,
    no_show_count INT DEFAULT 0,
    average_client_rating DECIMAL(3,1) DEFAULT 0.0,
    evaluation_count INT DEFAULT 0,
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_scores CHECK (
        attendance_score >= 0 AND attendance_score <= 100 AND
        punctuality_score >= 0 AND punctuality_score <= 100 AND
        client_rating >= 0 AND client_rating <= 100 AND
        overall_score >= 0 AND overall_score <= 100
    )
);

-- Table: client_evaluations
-- Stores client/supervisor ratings for guards after missions/shifts
CREATE TABLE IF NOT EXISTS client_evaluations (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    guard_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_id VARCHAR(36) REFERENCES shifts(id) ON DELETE SET NULL,
    mission_id VARCHAR(255),
    evaluator_name VARCHAR(255) NOT NULL,
    evaluator_role VARCHAR(50), -- Client, Supervisor, Manager
    rating DECIMAL(3,1) NOT NULL, -- 0-5 stars
    comment TEXT,
    categories JSONB DEFAULT '{}'::jsonb, -- Detailed ratings: {"professionalism": 5, "punctuality": 4, "reliability": 5}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

-- Table: punctuality_records
-- Tracks individual shift check-in times for punctuality analysis
CREATE TABLE IF NOT EXISTS punctuality_records (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    guard_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_id VARCHAR(36) NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_check_in_time TIMESTAMP WITH TIME ZONE,
    minutes_late INT DEFAULT 0, -- Negative = early, positive = late
    is_on_time BOOLEAN DEFAULT false, -- true if checked in within 5 minutes
    status VARCHAR(50), -- 'on_time', 'late', 'no_show', 'early'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guard_merit_scores_guard_id ON guard_merit_scores(guard_id);
CREATE INDEX IF NOT EXISTS idx_guard_merit_scores_overall_score ON guard_merit_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_guard_merit_scores_rank ON guard_merit_scores(rank);
CREATE INDEX IF NOT EXISTS idx_client_evaluations_guard_id ON client_evaluations(guard_id);
CREATE INDEX IF NOT EXISTS idx_client_evaluations_shift_id ON client_evaluations(shift_id);
CREATE INDEX IF NOT EXISTS idx_punctuality_records_guard_id ON punctuality_records(guard_id);
CREATE INDEX IF NOT EXISTS idx_punctuality_records_shift_id ON punctuality_records(shift_id);

-- Create initial merit score records for existing users
INSERT INTO guard_merit_scores (guard_id, attendance_score, punctuality_score, client_rating, overall_score)
SELECT id, 0.00, 0.00, 0.00, 0.00 FROM users WHERE role = 'user' AND id NOT IN (SELECT guard_id FROM guard_merit_scores)
ON CONFLICT (guard_id) DO NOTHING;
