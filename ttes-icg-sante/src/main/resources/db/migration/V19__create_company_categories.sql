-- Catégories propres aux entreprises
CREATE TABLE company_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Une entreprise possède une catégorie facultative.
-- Le choix de la catégorie pourra être rendu obligatoire ensuite.
ALTER TABLE companies
    ADD COLUMN category_id BIGINT;

ALTER TABLE companies
    ADD CONSTRAINT fk_company_category
    FOREIGN KEY (category_id)
    REFERENCES company_categories(id)
    ON DELETE RESTRICT;

CREATE INDEX idx_companies_category
    ON companies(category_id);
