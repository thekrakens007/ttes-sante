-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       first_name VARCHAR(100) NOT NULL,
                       last_name VARCHAR(100) NOT NULL,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,
                       phone VARCHAR(30),
                       enabled BOOLEAN NOT NULL DEFAULT TRUE,
                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ROLES
-- ============================================================

CREATE TABLE roles (
                       id BIGSERIAL PRIMARY KEY,
                       name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE user_roles (
                            user_id BIGINT NOT NULL,
                            role_id BIGINT NOT NULL,

                            PRIMARY KEY (user_id, role_id),

                            CONSTRAINT fk_user_roles_user
                                FOREIGN KEY (user_id)
                                    REFERENCES users(id)
                                    ON DELETE CASCADE,

                            CONSTRAINT fk_user_roles_role
                                FOREIGN KEY (role_id)
                                    REFERENCES roles(id)
                                    ON DELETE CASCADE
);

-- ============================================================
-- COMPANIES
-- Entreprises qui fournissent / fabriquent les produits
-- ============================================================

CREATE TABLE companies (
                           id BIGSERIAL PRIMARY KEY,
                           name VARCHAR(255) NOT NULL UNIQUE,
                           description TEXT,
                           logo_url VARCHAR(500),
                           website VARCHAR(500),
                           email VARCHAR(255),
                           phone VARCHAR(30),
                           active BOOLEAN NOT NULL DEFAULT TRUE,
                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CATEGORIES
-- Catégories hiérarchiques
-- Exemple :
-- Médicaments
--   └── Antalgiques
--       └── Paracétamol
-- ============================================================

CREATE TABLE categories (
                            id BIGSERIAL PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            description TEXT,
                            image_url VARCHAR(500),
                            parent_id BIGINT,
                            active BOOLEAN NOT NULL DEFAULT TRUE,
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                            CONSTRAINT fk_category_parent
                                FOREIGN KEY (parent_id)
                                    REFERENCES categories(id)
                                    ON DELETE SET NULL
);

-- ============================================================
-- DOMAINES / TRAITEMENTS THERAPEUTIQUES
-- ============================================================

CREATE TABLE therapeutic_areas (
                                   id BIGSERIAL PRIMARY KEY,
                                   name VARCHAR(255) NOT NULL UNIQUE,
                                   description TEXT,
                                   active BOOLEAN NOT NULL DEFAULT TRUE,
                                   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                   updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE products (
                          id BIGSERIAL PRIMARY KEY,

                          company_id BIGINT NOT NULL,

                          name VARCHAR(255) NOT NULL,
                          sku VARCHAR(100) NOT NULL UNIQUE,

                          description TEXT,

                          brand VARCHAR(255),

                          active_ingredient VARCHAR(500),

                          dosage VARCHAR(100),

                          form VARCHAR(100),

                          price NUMERIC(12, 2) NOT NULL,

                          requires_prescription BOOLEAN NOT NULL DEFAULT FALSE,

                          active BOOLEAN NOT NULL DEFAULT TRUE,

                          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                          CONSTRAINT fk_product_company
                              FOREIGN KEY (company_id)
                                  REFERENCES companies(id)
                                  ON DELETE RESTRICT,

                          CONSTRAINT chk_product_price
                              CHECK (price >= 0)
);

-- ============================================================
-- PRODUCT <-> CATEGORY
-- Un produit peut appartenir à plusieurs catégories
-- ============================================================

CREATE TABLE product_categories (
                                    product_id BIGINT NOT NULL,
                                    category_id BIGINT NOT NULL,

                                    PRIMARY KEY (product_id, category_id),

                                    CONSTRAINT fk_product_categories_product
                                        FOREIGN KEY (product_id)
                                            REFERENCES products(id)
                                            ON DELETE CASCADE,

                                    CONSTRAINT fk_product_categories_category
                                        FOREIGN KEY (category_id)
                                            REFERENCES categories(id)
                                            ON DELETE CASCADE
);

-- ============================================================
-- PRODUCT <-> THERAPEUTIC AREA
-- ============================================================

CREATE TABLE product_therapeutic_areas (
                                           product_id BIGINT NOT NULL,
                                           therapeutic_area_id BIGINT NOT NULL,

                                           PRIMARY KEY (product_id, therapeutic_area_id),

                                           CONSTRAINT fk_product_therapeutic_product
                                               FOREIGN KEY (product_id)
                                                   REFERENCES products(id)
                                                   ON DELETE CASCADE,

                                           CONSTRAINT fk_product_therapeutic_area
                                               FOREIGN KEY (therapeutic_area_id)
                                                   REFERENCES therapeutic_areas(id)
                                                   ON DELETE CASCADE
);

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================

CREATE TABLE product_images (
                                id BIGSERIAL PRIMARY KEY,

                                product_id BIGINT NOT NULL,

                                image_url VARCHAR(500) NOT NULL,

                                is_main BOOLEAN NOT NULL DEFAULT FALSE,

                                display_order INTEGER NOT NULL DEFAULT 0,

                                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                CONSTRAINT fk_product_images_product
                                    FOREIGN KEY (product_id)
                                        REFERENCES products(id)
                                        ON DELETE CASCADE
);

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE inventory (
                           id BIGSERIAL PRIMARY KEY,

                           product_id BIGINT NOT NULL UNIQUE,

                           quantity INTEGER NOT NULL DEFAULT 0,

                           minimum_quantity INTEGER NOT NULL DEFAULT 0,

                           updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                           CONSTRAINT fk_inventory_product
                               FOREIGN KEY (product_id)
                                   REFERENCES products(id)
                                   ON DELETE CASCADE,

                           CONSTRAINT chk_inventory_quantity
                               CHECK (quantity >= 0),

                           CONSTRAINT chk_inventory_minimum_quantity
                               CHECK (minimum_quantity >= 0)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_products_company
    ON products(company_id);

CREATE INDEX idx_products_name
    ON products(name);

CREATE INDEX idx_products_active
    ON products(active);

CREATE INDEX idx_categories_parent
    ON categories(parent_id);

CREATE INDEX idx_product_categories_category
    ON product_categories(category_id);

CREATE INDEX idx_product_therapeutic_area
    ON product_therapeutic_areas(therapeutic_area_id);

CREATE INDEX idx_product_images_product
    ON product_images(product_id);