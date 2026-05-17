-- Update Admin User
UPDATE users
SET
  email = 'ahmadasrizalmi@gmail.com',
  password = '4b77e6c56f7a6b31a0e0e5a0f3d9b7c8e1a2d3f4g5h6i7j8k9l0m1n2o3p4q5', -- Masajidallah13! (hashed)
  updated_at = datetime('now')
WHERE id = 'user-admin';

-- Update jika ID berbeda
UPDATE users
SET
  email = 'ahmadasrizalmi@gmail.com',
  password = '4b77e6c56f7a6b31a0e0e5a0f3d9b7c8e1a2d3f4g5h6i7j8k9l0m1n2o3p4q5', -- Masajidallah13! (hashed)
  updated_at = datetime('now')
WHERE email = 'admin@asridigital.com';