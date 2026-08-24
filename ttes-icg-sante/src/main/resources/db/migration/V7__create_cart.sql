CREATE TABLE carts (

                       id BIGSERIAL PRIMARY KEY,

                       user_id BIGINT NOT NULL UNIQUE,

                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,


                       CONSTRAINT fk_cart_user

                           FOREIGN KEY(user_id)

                               REFERENCES users(id)

                               ON DELETE CASCADE
);



CREATE TABLE cart_items (

                            id BIGSERIAL PRIMARY KEY,


                            cart_id BIGINT NOT NULL,


                            product_id BIGINT NOT NULL,


                            quantity INTEGER NOT NULL,


                            price NUMERIC(12,2) NOT NULL,



                            CONSTRAINT fk_cart_item_cart

                                FOREIGN KEY(cart_id)

                                    REFERENCES carts(id)

                                    ON DELETE CASCADE,



                            CONSTRAINT fk_cart_item_product

                                FOREIGN KEY(product_id)

                                    REFERENCES products(id)

);