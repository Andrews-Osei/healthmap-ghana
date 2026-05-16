-- Seed two demo users for the auth scaffold.
-- Passwords are bcrypt-hashed: demo / demo  and  admin / admin
-- (Change immediately in production.)

INSERT INTO users (username, email, hashed_password, role) VALUES
  ('demo',  'demo@healthmap.gh',
   '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'analyst'),
  ('admin', 'admin@healthmap.gh',
   '$2b$12$KIXxPfnK5p4bMrJxV.MN3.XCm9Z9k0rJoTu8q8tGXYbQ./Ap3M3J.', 'admin')
ON CONFLICT (username) DO NOTHING;
