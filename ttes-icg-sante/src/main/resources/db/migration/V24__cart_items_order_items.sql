

-- ============================================================
-- Ajout des cures dans le panier et dans les commandes
-- ============================================================
-- À placer dans : src/main/resources/db/migration
-- À renommer     : V<prochain numéro>__add_cure_to_cart_and_order_items.sql
--
-- Si la colonne cart_items.cure_id existe déjà (créée par une
-- migration précédente), supprime le bloc "PANIER" ci-dessous.
-- ============================================================


-- ------------------------------------------------------------
-- PANIER
-- ------------------------------------------------------------

ALTER TABLE cart_items
    ADD COLUMN cure_id BIGINT NULL;

-- Si une cure est supprimée, elle disparaît des paniers.
ALTER TABLE cart_items
    ADD CONSTRAINT fk_cart_items_cure
        FOREIGN KEY (cure_id) REFERENCES cures (id)
            ON DELETE CASCADE;

-- Une même cure ne peut apparaître qu'une fois par panier.
ALTER TABLE cart_items
    ADD CONSTRAINT uk_cart_cure
        UNIQUE (cart_id, cure_id);


-- ------------------------------------------------------------
-- COMMANDES
-- ------------------------------------------------------------

ALTER TABLE order_items
    ADD COLUMN cure_id BIGINT NULL;

-- Pas de suppression en cascade : l'historique des commandes
-- doit être conservé. Une cure déjà commandée ne peut donc pas
-- être supprimée (il faut la désactiver).
ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_cure
        FOREIGN KEY (cure_id) REFERENCES cures (id);

CREATE INDEX idx_order_items_cure
    ON order_items (cure_id);