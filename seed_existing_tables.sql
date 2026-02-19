-- Seed data for existing tables using the current user
-- User ID: 3c0f8f82-f271-424b-b15f-626b75dfad82 (username: user)

-- Firearms
INSERT INTO firearms (id, name, serial_number, model, caliber, status)
VALUES
  ('firearm-001', 'Glock 19', 'SN-GLK-19001', 'Glock 19', '9mm', 'available'),
  ('firearm-002', 'Remington 870', 'SN-REM-87002', 'Remington 870', '12ga', 'allocated')
ON CONFLICT (serial_number) DO NOTHING;

-- Firearm allocations
INSERT INTO firearm_allocations (id, guard_id, firearm_id, allocation_date, status)
VALUES
  ('alloc-001', '3c0f8f82-f271-424b-b15f-626b75dfad82', 'firearm-002', NOW() - INTERVAL '3 days', 'active')
ON CONFLICT (id) DO NOTHING;

UPDATE firearms SET status = 'allocated', updated_at = CURRENT_TIMESTAMP WHERE id = 'firearm-002';

-- Shifts
INSERT INTO shifts (id, guard_id, start_time, end_time, client_site, status)
VALUES
  ('shift-001', '3c0f8f82-f271-424b-b15f-626b75dfad82', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '8 hours', 'North Dock', 'completed'),
  ('shift-002', '3c0f8f82-f271-424b-b15f-626b75dfad82', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '8 hours', 'Warehouse B', 'scheduled')
ON CONFLICT (id) DO NOTHING;

-- Attendance
INSERT INTO attendance (id, guard_id, shift_id, check_in_time, check_out_time, status)
VALUES
  ('att-001', '3c0f8f82-f271-424b-b15f-626b75dfad82', 'shift-001', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '8 hours', 'checked_out')
ON CONFLICT (id) DO NOTHING;
