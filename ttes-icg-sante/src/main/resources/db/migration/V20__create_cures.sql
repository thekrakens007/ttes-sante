
CREATE TABLE cures (
                       id BIGSERIAL PRIMARY KEY,
                       name VARCHAR(180) NOT NULL,
                       description TEXT,
                       image_url VARCHAR(1000),
                       active BOOLEAN NOT NULL DEFAULT FALSE,
                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cure_items (
                            id BIGSERIAL PRIMARY KEY,
                            cure_id BIGINT NOT NULL,
                            product_id BIGINT NOT NULL,
                            quantity INTEGER NOT NULL,

                            CONSTRAINT fk_cure_items_cure
                                FOREIGN KEY (cure_id)
                                    REFERENCES cures(id)
                                    ON DELETE CASCADE,

                            CONSTRAINT fk_cure_items_product
                                FOREIGN KEY (product_id)
                                    REFERENCES products(id),

                            CONSTRAINT uq_cure_product
                                UNIQUE (cure_id, product_id),

                            CONSTRAINT chk_cure_item_quantity
                                CHECK (quantity > 0)
);

CREATE INDEX idx_cures_active
    ON cures(active);

CREATE INDEX idx_cure_items_cure
    ON cure_items(cure_id);
