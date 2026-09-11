ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN verification_token_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_password_token_expiry TIMESTAMP;

-- Les comptes déjà existants ne doivent pas être bloqués
UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;