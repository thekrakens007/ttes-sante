ALTER TABLE orders
    ADD COLUMN delivery_address VARCHAR(500);

ALTER TABLE orders
    ADD COLUMN customer_note TEXT;

UPDATE orders
SET delivery_address = 'Adresse non renseignée'
WHERE delivery_address IS NULL;

ALTER TABLE orders
    ALTER COLUMN delivery_address SET NOT NULL;