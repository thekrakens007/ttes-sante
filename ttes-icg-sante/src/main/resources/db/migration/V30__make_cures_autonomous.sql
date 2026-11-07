
-- ============================================================
-- V30 : Rendre les cures autonomes
-- ============================================================
-- Chaque cure possède désormais :
--   - un type : PREVENTIVE ou CURATIVE
--   - un prix indépendant des produits
--
-- Les références cart_items.cure_id et order_items.cure_id
-- sont conservées.
--
-- Les anciennes commandes ne sont pas modifiées.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Ajouter le type
-- ------------------------------------------------------------

ALTER TABLE cures
    ADD COLUMN type VARCHAR(20);

-- Les cures existantes sont initialisées comme préventives.
UPDATE cures
SET type = 'PREVENTIVE'
WHERE type IS NULL;

ALTER TABLE cures
    ALTER COLUMN type SET NOT NULL;

ALTER TABLE cures
    ADD CONSTRAINT chk_cures_type
        CHECK (type IN ('PREVENTIVE', 'CURATIVE'));


-- ------------------------------------------------------------
-- 2. Ajouter le prix autonome
-- ------------------------------------------------------------

ALTER TABLE cures
    ADD COLUMN price NUMERIC(12, 2);

-- Calculer le prix initial à partir des anciens produits.
-- Le prix devient ensuite indépendant de ces produits.

UPDATE cures c
SET price = totals.total_price
    FROM (
    SELECT
        ci.cure_id,
        SUM(ci.quantity * p.price) AS total_price
    FROM cure_items ci
    INNER JOIN products p ON p.id = ci.product_id
    GROUP BY ci.cure_id
) totals
WHERE totals.cure_id = c.id;


-- Empêcher une migration silencieuse avec des cures
-- sans composition ou sans prix calculable.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM cures
        WHERE price IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration V30 impossible : certaines cures ne possèdent pas de prix calculable. Vérifier cure_items et products.price.';
END IF;
END
$$;

ALTER TABLE cures
    ALTER COLUMN price SET NOT NULL;

ALTER TABLE cures
    ADD CONSTRAINT chk_cures_price
        CHECK (price >= 0);


-- ------------------------------------------------------------
-- 3. Supprimer l'ancienne relation cure / produits
-- ------------------------------------------------------------

-- Les cures ne sont désormais plus des compositions de produits.
-- Les références des paniers et commandes sont conservées.

DROP TABLE cure_items;


-- ------------------------------------------------------------
-- 4. Index pour la pagination
-- ------------------------------------------------------------

-- Pagination administrative : toutes les cures,
-- triées par date de création.

CREATE INDEX idx_cures_created_at_id
    ON cures (created_at DESC, id DESC);


-- Pagination publique : uniquement les cures actives,
-- avec possibilité de filtrer par type.

CREATE INDEX idx_cures_active_type_created_at
    ON cures (type, created_at DESC, id DESC)
    WHERE active = TRUE;
