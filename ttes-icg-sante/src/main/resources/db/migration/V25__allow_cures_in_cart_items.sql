
-- Allow products, bundles and cures in cart items.
-- Each cart item must reference exactly one type of item.

ALTER TABLE cart_items
DROP CONSTRAINT chk_cart_item_product_or_bundle;

ALTER TABLE cart_items
    ADD CONSTRAINT chk_cart_item_product_or_bundle
        CHECK (
            (
                CASE WHEN product_id IS NOT NULL THEN 1 ELSE 0 END
                    +
                CASE WHEN bundle_id IS NOT NULL THEN 1 ELSE 0 END
                    +
                CASE WHEN cure_id IS NOT NULL THEN 1 ELSE 0 END
                ) = 1
            );
