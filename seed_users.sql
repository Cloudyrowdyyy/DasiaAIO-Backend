-- Insert test users with bcrypt-hashed passwords
-- admin / admin123
-- user / user123
INSERT INTO users (id, username, email, password, role, full_name, phone_number, verified)
VALUES 
  ('admin-001', 'admin', 'admin@example.com', '$2b$12$KIX1qx/R.eXNP8DjJjYUWOffKLLfHH5/iS9OqfXL9PjqIqlRUv.BO', 'admin', 'Administrator', '+1234567890', true),
  ('user-001', 'user', 'user@example.com', '$2b$12$jfNM4D4qJ9u5mK3pL9q0hOlRlZqQ7ZqQ0dKqL0L0K0K0K0K0K0K0K', 'user', 'Regular User', '+1987654321', true);
