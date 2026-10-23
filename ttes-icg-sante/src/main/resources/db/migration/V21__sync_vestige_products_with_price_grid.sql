-- Synchronises the Vestige Cameroun catalogue with the 2025 client price grid.
-- Idempotent upsert: matches existing products by SKU, name or alternate name
-- (case-insensitive) within the Vestige company, updates price/description/dosage,
-- inserts the missing ones. Nothing is deleted.

CREATE TEMPORARY TABLE vestige_grid (
    sku               VARCHAR(100)  NOT NULL,
    name              VARCHAR(255)  NOT NULL,
    alt_name          VARCHAR(255),
    description       TEXT          NOT NULL,
    active_ingredient VARCHAR(500),
    dosage            VARCHAR(100),
    form              VARCHAR(100),
    price             NUMERIC(12, 2) NOT NULL
) ON COMMIT DROP;

INSERT INTO vestige_grid (sku, name, alt_name, description, active_ingredient, dosage, form, price) VALUES
-- COMPLEMENTS ALIMENTAIRES
('VST-001', 'NONI 500 mg', NULL, 'Complément alimentaire Vestige à base de Noni (Morinda citrifolia), capsules de 500 mg.', 'Noni (Morinda citrifolia)', '500 mg', 'Capsule', 12500.00),
('VST-002', 'Spirulina 500 mg', NULL, 'Complément alimentaire Vestige à base de spiruline, capsules de 500 mg.', 'Spiruline', '500 mg', 'Capsule', 11000.00),
('VST-003', 'Amla 500 mg', NULL, 'Complément alimentaire Vestige à base d''Amla (groseille indienne, Emblica officinalis), capsules de 500 mg.', 'Amla (Emblica officinalis)', '500 mg', 'Capsule', 8000.00),
('VST-004', 'Aloe Vera 500 mg', NULL, 'Complément alimentaire Vestige à base d''Aloe Vera, capsules de 500 mg.', 'Aloe Vera', '500 mg', 'Capsule', 8000.00),
('VST-005', 'Neem 0.25 ml', NULL, 'Complément alimentaire Vestige à base de Neem (Azadirachta indica), dosage indiqué sur la grille : 0,25 ml.', 'Neem (Azadirachta indica)', '0.25 ml', 'Capsule', 9000.00),
('VST-006', 'Ganoderma 425 mg', NULL, 'Complément alimentaire Vestige à base de Ganoderma (Reishi), capsules de 425 mg.', 'Ganoderma lucidum', '425 mg', 'Capsule', 18500.00),
('VST-007', 'Flax Oil 500 mg', NULL, 'Complément alimentaire Vestige à base d''huile de lin (source d''oméga-3), capsules de 500 mg.', 'Huile de lin', '500 mg', 'Capsule', 12500.00),
('VST-008', 'Glucosamine 450 mg', NULL, 'Complément alimentaire Vestige à base de glucosamine pour le confort articulaire, comprimés de 450 mg.', 'Glucosamine', '450 mg', 'Comprimé', 14500.00),
('VST-009', 'Folic & Iron Plus', 'Folic and Iron Plus', 'Complément alimentaire Vestige associant acide folique et fer.', 'Acide folique, Fer', NULL, 'Comprimé', 7500.00),
('VST-010', 'Prime Krill Oil 500 mg', 'Prime Krill Oil 500 mg 30', 'Complément alimentaire Vestige à base d''huile de krill (source d''oméga-3), capsules de 500 mg, boîte de 30.', 'Huile de krill', '500 mg', 'Capsule (30)', 22500.00),
('VST-011', 'Calcium 625 mg', 'Calcium 625 mg 100', 'Complément alimentaire Vestige à base de calcium, comprimés de 625 mg, boîte de 100.', 'Calcium', '625 mg', 'Comprimé (100)', 7500.00),
('VST-012', 'Coenzyme Q10', NULL, 'Complément alimentaire Vestige à base de coenzyme Q10 (ubiquinone).', 'Coenzyme Q10', NULL, 'Capsule', 17000.00),
('VST-013', 'Veslim Shake - Mango Flavour', NULL, 'Substitut de repas en poudre Vestige Veslim, saveur mangue.', NULL, NULL, 'Poudre', 24000.00),
('VST-014', 'ENGRAIS AGRI 82 500 ml', NULL, 'Engrais agricole liquide Vestige Agri 82, flacon de 500 ml. Produit à usage agricole.', NULL, '500 ml', 'Liquide', 21000.00),
('VST-015', 'ENGRAIS AGRI HUMIC 500 ml', NULL, 'Engrais agricole liquide Vestige Agri Humic (acides humiques), flacon de 500 ml. Produit à usage agricole.', 'Acides humiques', '500 ml', 'Liquide', 21000.00),
('VST-016', 'ENGRAIS AGRI HUMIC Granulés 5 kg', NULL, 'Engrais agricole en granulés Vestige Agri Humic (acides humiques), sac de 5 kg. Produit à usage agricole.', 'Acides humiques', '5 kg', 'Granulés', 31000.00),
('VST-017', 'Colostrum', NULL, 'Complément alimentaire Vestige à base de colostrum.', 'Colostrum', NULL, 'Capsule', 17000.00),
('VST-018', 'Grand Bary', NULL, 'Complément alimentaire Vestige Grand Bary.', NULL, NULL, NULL, 36000.00),
('VST-019', 'FIBER', NULL, 'Complément alimentaire Vestige riche en fibres alimentaires.', 'Fibres alimentaires', NULL, NULL, 21000.00),
('VST-020', 'L-Arginine 10 g', 'L-Argine 10 g', 'Complément alimentaire Vestige à base de L-arginine, dosage de 10 g.', 'L-Arginine', '10 g', 'Poudre', 31000.00),
('VST-021', 'Vestige Veslim Tea and Green Coffee', NULL, 'Mélange de thé et de café vert Vestige Veslim, pour la gestion du poids.', 'Thé, Café vert', NULL, 'Infusion', 22000.00),
('VST-022', 'Vestige Veslim Capsule', NULL, 'Capsules Vestige Veslim, complément alimentaire pour la gestion du poids.', NULL, NULL, 'Capsule', 23000.00),
('VST-023', 'Eye Support', NULL, 'Complément alimentaire Vestige pour le soutien de la vision.', NULL, NULL, 'Capsule', 17000.00),
('VST-024', 'Detox Foot Patches', NULL, 'Patchs de détoxification pour les pieds Vestige.', NULL, NULL, 'Patch', 22500.00),
('VST-025', 'Prime Combiotics', NULL, 'Complément alimentaire Vestige Prime, probiotiques et prébiotiques pour l''équilibre intestinal.', 'Probiotiques, Prébiotiques', NULL, 'Capsule', 16500.00),
('VST-026', 'Ayusante Prostate Care', NULL, 'Complément alimentaire Vestige Ayusante pour le bien-être de la prostate.', NULL, NULL, 'Capsule', 17500.00),
('VST-027', 'Ayusante Gluco Health', NULL, 'Complément alimentaire Vestige Ayusante pour l''équilibre de la glycémie.', NULL, NULL, 'Capsule', 15000.00),
('VST-028', 'Ayusante Liverhealth', 'Ayusante Liver Health', 'Complément alimentaire Vestige Ayusante pour la santé du foie.', NULL, NULL, 'Capsule', 15000.00),
-- PRODUITS D'ENTRETIEN
('VST-029', 'Ultra Wash Liquid Laundry Detergent 500 ml', NULL, 'Lessive liquide Vestige Ultra Wash, flacon de 500 ml.', NULL, '500 ml', 'Liquide', 10000.00),
('VST-030', 'Ultra Guard Toilet Cleaner 500 ml', NULL, 'Nettoyant pour toilettes Vestige Ultra Guard, flacon de 500 ml.', NULL, '500 ml', 'Liquide', 5000.00),
('VST-031', 'Ultra Scrub Dishwashing Liquid 500 ml', NULL, 'Liquide vaisselle Vestige Ultra Scrub, flacon de 500 ml.', NULL, '500 ml', 'Liquide', 5000.00),
-- PRODUITS DIETETIQUES
('VST-032', 'Zeta Tea', NULL, 'Thé diététique Vestige Zeta.', NULL, NULL, 'Infusion', 7000.00),
('VST-033', 'Zeta Coffee', 'Zeta Cofee', 'Café diététique Vestige Zeta.', NULL, NULL, 'Poudre', 5000.00),
-- COSMETIQUES ET HYGIENE
('VST-034', 'Assure Complexion Bar (Kesar, Olive & Honey) 75 g', NULL, 'Savon pour le teint Vestige Assure (safran, olive et miel), pain de 75 g.', NULL, '75 g', 'Savon', 2000.00),
('VST-035', 'Assure Daily Moisturiser 250 ml', NULL, 'Lotion hydratante quotidienne Vestige Assure, flacon de 250 ml.', NULL, '250 ml', 'Lotion', 8000.00),
('VST-036', 'Assure Body Wash', 'Assure BODY WASH', 'Gel douche Vestige Assure.', NULL, NULL, 'Gel', 7000.00),
('VST-037', 'Assure Hand Wash', 'Assure HAND WASH', 'Lave-mains Vestige Assure.', NULL, NULL, 'Liquide', 4000.00),
('VST-038', 'Dentassure Gano Toothpaste 100 g', NULL, 'Dentifrice au Ganoderma Vestige Dentassure, tube de 100 g.', 'Ganoderma', '100 g', 'Dentifrice', 3500.00),
('VST-039', 'Assure Purifying Cleanser + Toner 250 ml', NULL, 'Nettoyant purifiant et tonique pour le visage Vestige Assure, flacon de 250 ml.', NULL, '250 ml', 'Lotion', 8000.00),
('VST-040', 'Parfum de poche (Assure Blossom Perfume)', 'Parfum poche (Assure Blossom perfum)', 'Parfum de poche Vestige Assure Blossom.', NULL, NULL, 'Parfum', 3500.00),
('VST-041', 'Assure Perfume Spray Arctic', 'Assure Perfum spray Artic', 'Parfum en spray Vestige Assure, senteur Arctic.', NULL, NULL, 'Spray', 8000.00),
('VST-042', 'Assure Rapture Deo Women', NULL, 'Déodorant pour femme Vestige Assure Rapture.', NULL, NULL, 'Spray', 8000.00),
('VST-043', 'Assure Mild Exfoliating Face Scrub 60 g', NULL, 'Gommage doux exfoliant pour le visage Vestige Assure, tube de 60 g.', NULL, '60 g', 'Crème', 6500.00),
('VST-044', 'Assure Anti-Ageing Night Cream 60 g', NULL, 'Crème de nuit anti-âge Vestige Assure, pot de 60 g.', NULL, '60 g', 'Crème', 6500.00),
('VST-045', 'Assure Clarifying Face Wash 60 g', NULL, 'Nettoyant clarifiant pour le visage Vestige Assure, tube de 60 g.', NULL, '60 g', 'Gel', 5000.00),
('VST-046', 'DewGarden Sanitary (Serviette Hygiénique)', NULL, 'Serviettes hygiéniques Vestige DewGarden.', NULL, NULL, 'Serviette hygiénique', 3500.00),
('VST-047', 'Poudre femme (Echant Body Talc)', 'Poudre femme (Echant body talc)', 'Poudre talquée pour le corps Vestige Echant, pour femme.', NULL, NULL, 'Poudre', 3000.00),
('VST-048', 'Foot Cream', NULL, 'Crème pour les pieds Vestige.', NULL, NULL, 'Crème', 5000.00),
('VST-049', 'Assure Soap', NULL, 'Savon Vestige Assure.', NULL, NULL, 'Savon', 2000.00);

-- Update products that already exist
UPDATE products p
SET price = g.price,
    description = g.description,
    dosage = COALESCE(g.dosage, p.dosage),
    form = COALESCE(g.form, p.form),
    active_ingredient = COALESCE(g.active_ingredient, p.active_ingredient),
    brand = COALESCE(NULLIF(p.brand, ''), 'Vestige'),
    updated_at = CURRENT_TIMESTAMP
FROM vestige_grid g
WHERE p.company_id = (
        SELECT c.id FROM companies c
        WHERE c.id = 4 OR c.name ILIKE 'vestige%'
        ORDER BY (c.id = 4) DESC, c.id LIMIT 1)
  AND (p.sku = g.sku
       OR lower(trim(p.name)) = lower(g.name)
       OR lower(trim(p.name)) = lower(g.alt_name));

-- Insert products that are missing
INSERT INTO products (company_id, name, sku, description, brand, active_ingredient, dosage, form, price,
                      requires_prescription, active)
SELECT v.company_id, g.name, g.sku, g.description, 'Vestige', g.active_ingredient, g.dosage, g.form, g.price,
       FALSE, TRUE
FROM vestige_grid g
CROSS JOIN (
    SELECT c.id AS company_id FROM companies c
    WHERE c.id = 4 OR c.name ILIKE 'vestige%'
    ORDER BY (c.id = 4) DESC, c.id LIMIT 1
) v
WHERE NOT EXISTS (
    SELECT 1 FROM products p
    WHERE p.sku = g.sku
       OR (p.company_id = v.company_id
           AND (lower(trim(p.name)) = lower(g.name)
                OR lower(trim(p.name)) = lower(g.alt_name))));
