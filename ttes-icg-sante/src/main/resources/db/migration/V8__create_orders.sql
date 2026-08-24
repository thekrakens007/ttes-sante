CREATE TABLE orders (

                        id BIGSERIAL PRIMARY KEY,

                        user_id BIGINT NOT NULL,

                        status VARCHAR(50) NOT NULL,

                        total_amount NUMERIC(12,2) NOT NULL,

                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,


                        CONSTRAINT fk_order_user

                            FOREIGN KEY(user_id)

                                REFERENCES users(id)

);



CREATE TABLE order_items (

                             id BIGSERIAL PRIMARY KEY,


                             order_id BIGINT NOT NULL,


                             product_id BIGINT NOT NULL,


                             quantity INTEGER NOT NULL,


                             price NUMERIC(12,2) NOT NULL,


                             CONSTRAINT fk_order_item_order

                                 FOREIGN KEY(order_id)

                                     REFERENCES orders(id)

                                     ON DELETE CASCADE,


                             CONSTRAINT fk_order_item_product

                                 FOREIGN KEY(product_id)

                                     REFERENCES products(id)

);