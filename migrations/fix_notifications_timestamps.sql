-- Fix notifications table timestamp types
DROP TABLE IF EXISTS notifications CASCADE;

-- Recreate notifications table with correct timestamp types
CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    related_shift_id TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Fix guard_availability table
DROP TABLE IF EXISTS guard_availability CASCADE;

CREATE TABLE guard_availability (
    id TEXT PRIMARY KEY,
    guard_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    available_from TIMESTAMPTZ,
    available_to TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guard_availability_guard_id ON guard_availability(guard_id);
CREATE INDEX idx_guard_availability_available ON guard_availability(guard_id, available);
