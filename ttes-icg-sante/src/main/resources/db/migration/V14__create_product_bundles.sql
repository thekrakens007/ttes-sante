-- =========================================================
-- PRODUCT BUNDLES
-- =========================================================

CREATE TABLE product_bundles (
                                 id BIGSERIAL PRIMARY KEY,

                                 name VARCHAR(255) NOT NULL,

                                 description TEXT,

                                 price NUMERIC(12, 2) NOT NULL,

                                 active BOOLEAN NOT NULL DEFAULT TRUE,

                                 created_at TIMESTAMP NOT NULL,

                                 updated_at TIMESTAMP NOT NULL
);


-- =========================================================
-- BUNDLE ITEMS
-- Produits contenus dans un pack
-- =========================================================

CREATE TABLE bundle_items (
                              id BIGSERIAL PRIMARY KEY,

                              bundle_id BIGINT NOT NULL,

                              product_id BIGINT NOT NULL,

                              quantity INTEGER NOT NULL,

                              CONSTRAINT fk_bundle_items_bundle
                                  FOREIGN KEY (bundle_id)
                                      REFERENCES product_bundles(id)
                                      ON DELETE CASCADE,

                              CONSTRAINT fk_bundle_items_product
                                  FOREIGN KEY (product_id)
                                      REFERENCES products(id)
                                      ON DELETE RESTRICT,

                              CONSTRAINT uk_bundle_product
                                  UNIQUE (bundle_id, product_id),

                              CONSTRAINT chk_bundle_item_quantity
                                  CHECK (quantity > 0)
);


-- =========================================================
-- BUNDLE IMAGES
-- Plusieurs images pour un pack
-- =========================================================

CREATE TABLE bundle_images (
                               id BIGSERIAL PRIMARY KEY,

                               bundle_id BIGINT NOT NULL,

                               image_url TEXT NOT NULL,

                               is_main BOOLEAN NOT NULL DEFAULT FALSE,

                               display_order INTEGER NOT NULL DEFAULT 0,

                               created_at TIMESTAMP NOT NULL,

                               CONSTRAINT fk_bundle_images_bundle
                                   FOREIGN KEY (bundle_id)
                                       REFERENCES product_bundles(id)
                                       ON DELETE CASCADE,

                               CONSTRAINT chk_bundle_image_display_order
                                   CHECK (display_order >= 0)
);


-- =========================================================
-- Une seule image principale par pack
-- =========================================================

CREATE UNIQUE INDEX uk_bundle_main_image
    ON bundle_images(bundle_id)
    WHERE is_main = TRUE;