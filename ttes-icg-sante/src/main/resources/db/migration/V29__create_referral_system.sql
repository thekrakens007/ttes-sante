ALTER TABLE users
    ADD COLUMN referral_code VARCHAR(20);

ALTER TABLE users
    ADD COLUMN referred_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

UPDATE users
SET referral_code = upper(substr(md5(random()::text || id::text), 1, 8))
WHERE referral_code IS NULL;

ALTER TABLE users
    ADD CONSTRAINT uk_users_referral_code UNIQUE (referral_code);

CREATE INDEX idx_users_referred_by ON users(referred_by_id);

-- Journal des points : un seul SIGNUP par filleul, un seul PURCHASE par commande
CREATE TABLE referral_events (
    id BIGSERIAL PRIMARY KEY,
    referrer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL,
    points INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uk_referral_signup
    ON referral_events(referred_user_id) WHERE type = 'SIGNUP';

CREATE UNIQUE INDEX uk_referral_purchase
    ON referral_events(order_id) WHERE type = 'PURCHASE';

CREATE INDEX idx_referral_events_referrer ON referral_events(referrer_id);

-- Paliers de récompenses, une jauge par type (SIGNUP / PURCHASE)
CREATE TABLE referral_tiers (
    id BIGSERIAL PRIMARY KEY,
    gauge VARCHAR(20) NOT NULL,
    level INT NOT NULL,
    threshold INT NOT NULL,
    reward_label VARCHAR(255) NOT NULL,
    UNIQUE (gauge, level)
);

INSERT INTO referral_tiers (gauge, level, threshold, reward_label) VALUES
    ('SIGNUP', 1, 50, 'Récompense inscription niveau 1'),
    ('SIGNUP', 2, 100, 'Récompense inscription niveau 2'),
    ('SIGNUP', 3, 200, 'Récompense inscription niveau 3'),
    ('SIGNUP', 4, 400, 'Récompense inscription niveau 4'),
    ('SIGNUP', 5, 800, 'Récompense inscription niveau 5'),
    ('PURCHASE', 1, 50, 'Récompense achats niveau 1'),
    ('PURCHASE', 2, 100, 'Récompense achats niveau 2'),
    ('PURCHASE', 3, 200, 'Récompense achats niveau 3'),
    ('PURCHASE', 4, 400, 'Récompense achats niveau 4'),
    ('PURCHASE', 5, 800, 'Récompense achats niveau 5');
