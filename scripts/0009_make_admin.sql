-- Update ahmadasrizalmi@gmail.com to admin role
-- Date: 2026-05-18

UPDATE users SET role = 'admin' WHERE email = 'ahmadasrizalmi@gmail.com';

-- Verify the update
SELECT id, name, email, role, is_all_access FROM users WHERE email = 'ahmadasrizalmi@gmail.com';