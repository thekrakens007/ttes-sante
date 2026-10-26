-- V29__allow_cure_in_order_items.sql
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS chk_order_item_product_or_bundle;

ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS chk_order_item_product_bundle_or_cure;

ALTER TABLE order_items
    ADD CONSTRAINT chk_order_item_product_bundle_or_cure
        CHECK (
            (CASE WHEN product_id IS NOT NULL THEN 1 ELSE 0 END
                + CASE WHEN bundle_id  IS NOT NULL THEN 1 ELSE 0 END
                + CASE WHEN cure_id    IS NOT NULL THEN 1 ELSE 0 END) = 1
            );