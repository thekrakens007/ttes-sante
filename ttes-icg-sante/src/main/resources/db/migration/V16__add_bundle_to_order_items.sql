ALTER TABLE order_items
    ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS bundle_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_class r ON r.oid = c.confrelid
        WHERE t.relname = 'order_items'
          AND c.contype = 'f'
          AND r.relname = 'product_bundles'
    ) THEN
ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_bundle
        FOREIGN KEY (bundle_id)
            REFERENCES product_bundles(id)
            ON DELETE RESTRICT;
END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'order_items'
          AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) LIKE '%product_id IS NOT NULL%'
          AND pg_get_constraintdef(c.oid) LIKE '%bundle_id IS NOT NULL%'
    ) THEN
ALTER TABLE order_items
    ADD CONSTRAINT chk_order_item_product_or_bundle
        CHECK (
            (product_id IS NOT NULL AND bundle_id IS NULL)
                OR
            (product_id IS NULL AND bundle_id IS NOT NULL)
            );
END IF;
END $$;