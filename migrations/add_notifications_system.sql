-- Create notifications table for web-based notification system
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'replacement_request'
    related_shift_id TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create guard availability table
CREATE TABLE IF NOT EXISTS guard_availability (
    id TEXT PRIMARY KEY,
    guard_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    available_from TIMESTAMPTZ,
    available_to TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guard_availability_guard_id ON guard_availability(guard_id);
CREATE INDEX IF NOT EXISTS idx_guard_availability_available ON guard_availability(guard_id, available);

-- Add grace_period_minutes column to shifts table for flexible no-show detection
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15;

-- Add replacement_status to track replacement process
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS replacement_status TEXT DEFAULT 'not_needed'; 
-- Possible values: 'not_needed', 'searching', 'found', 'accepted'

COMMENT ON TABLE notifications IS 'Stores web-based notifications for users including replacement requests';
COMMENT ON TABLE guard_availability IS 'Tracks guard availability status for automatic substitute matching';
