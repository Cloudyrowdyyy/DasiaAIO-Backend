-- Seed data for user dashboard views

-- Users (guard/user)
INSERT INTO users (id, username, email, password, role, full_name, phone_number, license_number, license_expiry_date, verified)
VALUES
  ('user-001', 'user', 'user@example.com', '$2b$12$jfNM4D4qJ9u5mK3pL9q0hOlRlZqQ7ZqQ0dKqL0L0K0K0K0K0K0K', 'user', 'Regular User', '+1987654321', 'LIC-2024-0001', '2026-12-31T00:00:00Z', true)
ON CONFLICT (id) DO NOTHING;

-- Firearms
INSERT INTO firearms (id, name, serial_number, model, caliber, status)
VALUES
  ('firearm-001', 'Glock 19', 'SN-GLK-19001', 'Glock 19', '9mm', 'available'),
  ('firearm-002', 'Remington 870', 'SN-REM-87002', 'Remington 870', '12ga', 'allocated')
ON CONFLICT (serial_number) DO NOTHING;

-- Firearm allocations
INSERT INTO firearm_allocations (id, guard_id, firearm_id, allocation_date, status)
VALUES
  ('alloc-001', 'user-001', 'firearm-002', NOW() - INTERVAL '3 days', 'active')
ON CONFLICT (id) DO NOTHING;

UPDATE firearms SET status = 'allocated', updated_at = CURRENT_TIMESTAMP WHERE id = 'firearm-002';

-- Shifts
INSERT INTO shifts (id, guard_id, start_time, end_time, client_site, status)
VALUES
  ('shift-001', 'user-001', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '8 hours', 'North Dock', 'completed'),
  ('shift-002', 'user-001', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '8 hours', 'Warehouse B', 'scheduled')
ON CONFLICT (id) DO NOTHING;

-- Attendance
INSERT INTO attendance (id, guard_id, shift_id, check_in_time, check_out_time, status)
VALUES
  ('att-001', 'user-001', 'shift-001', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '8 hours', 'checked_out')
ON CONFLICT (id) DO NOTHING;

-- Guard permits
INSERT INTO guard_firearm_permits (id, guard_id, firearm_id, permit_type, issued_date, expiry_date, status)
VALUES
  ('permit-001', 'user-001', 'firearm-002', 'Firearm Carry', NOW() - INTERVAL '180 days', NOW() + INTERVAL '180 days', 'active'),
  ('permit-002', 'user-001', NULL, 'Site Access', NOW() - INTERVAL '120 days', NOW() + INTERVAL '245 days', 'active')
ON CONFLICT (id) DO NOTHING;

-- Support tickets
INSERT INTO support_tickets (id, guard_id, subject, message, status)
VALUES
  ('ticket-001', 'user-001', 'Schedule adjustment', 'Requesting a swap for next week.', 'open'),
  ('ticket-002', 'user-001', 'Permit update', 'Please confirm updated permit status.', 'open')
ON CONFLICT (id) DO NOTHING;
