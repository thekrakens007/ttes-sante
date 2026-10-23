-- Partner catalogues: synchronises every partner product with the 2025 tariff grids.
-- Idempotent: matches products per company by SKU, name or alternate name (accent-,
-- case- and spacing-insensitive), updates price/description/dosage/form/ingredients,
-- inserts the missing ones, removes duplicates of the same product (deactivated
-- instead of deleted when referenced by carts/orders/bundles) and sets stock to 200
-- so products show up in the public product list (which hides out-of-stock products).

CREATE OR REPLACE FUNCTION pg_temp.nk(t TEXT) RETURNS TEXT AS $$
    SELECT regexp_replace(
        translate(lower(coalesce(t, '')),
                  'àáâãäåçèéêëìíîïñòóôõöùúûüýÿœ',
                  'aaaaaaceeeeiiiinooooouuuuyyo'),
        '[^a-z0-9]', '', 'g')
$$ LANGUAGE SQL IMMUTABLE;

CREATE TEMPORARY TABLE partner_companies (
    code VARCHAR(1) PRIMARY KEY,
    brand VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_id BIGINT
) ON COMMIT DROP;

INSERT INTO partner_companies (code, brand, company_name) VALUES
('V', 'Vestige', 'Vestige Cameroun'),
('F', 'Forever Living', 'Forever Living Cameroun'),
('T', 'Tiens', 'Tiens Cameroun'),
('D', 'Dynace', 'Dynace Global Cameroun'),
('P', 'PhytoScience', 'PhytoScience Cameroun'),
('S', 'DAS Group', 'DAS Group Cameroun'),
('Y', 'Yupi', 'Yupi Cameroun'),
('L', 'Longrich', 'Longrich Cameroun');

-- Existing company: Vestige keeps id 4 when present, others are matched by name prefix
UPDATE partner_companies pc
SET company_id = (
    SELECT c.id FROM companies c
    WHERE (pc.code = 'V' AND c.id = 4)
       OR lower(c.name) LIKE CASE pc.code
            WHEN 'V' THEN 'vestige%' WHEN 'F' THEN 'forever%' WHEN 'T' THEN 'tiens%'
            WHEN 'D' THEN 'dynace%' WHEN 'P' THEN 'phyto%' WHEN 'S' THEN 'das %'
            WHEN 'Y' THEN 'yupi%' WHEN 'L' THEN 'longrich%' END
    ORDER BY (c.id = 4 AND pc.code = 'V') DESC, c.id
    LIMIT 1);

INSERT INTO companies (name, description, active, country)
SELECT pc.company_name, 'Partenaire ' || pc.brand, TRUE, 'CAMEROUN'
FROM partner_companies pc
WHERE pc.company_id IS NULL
ON CONFLICT (name) DO NOTHING;

UPDATE partner_companies pc
SET company_id = c.id
FROM companies c
WHERE pc.company_id IS NULL AND lower(c.name) = lower(pc.company_name);

CREATE TEMPORARY TABLE partner_grid (
    code              VARCHAR(1)    NOT NULL,
    sku               VARCHAR(100)  NOT NULL,
    name              VARCHAR(255)  NOT NULL,
    alt_name          VARCHAR(255),
    price             NUMERIC(12, 2) NOT NULL,
    form              VARCHAR(100),
    dosage            VARCHAR(1000),
    active_ingredient VARCHAR(500),
    ingredients       TEXT,
    description       TEXT          NOT NULL,
    company_id        BIGINT,
    product_id        BIGINT
) ON COMMIT DROP;

INSERT INTO partner_grid (code, sku, name, alt_name, price, form, dosage, active_ingredient, ingredients, description) VALUES
('V', 'VST-001', 'NONI 500 mg', 'Noni 500 mg', 12500, 'Capsule', '500 mg', 'Noni (Morinda citrifolia)', 'Extrait de fruit de Noni (Morinda citrifolia), enveloppe de capsule.', 'Complément alimentaire à base de Noni, fruit tropical riche en antioxydants. Soutient les défenses naturelles, la vitalité et le bien-être général. Capsules de 500 mg ; suivre la posologie indiquée sur l''emballage.'),
('V', 'VST-002', 'Spirulina 500 mg', NULL, 11000, 'Capsule', '500 mg', 'Spiruline (Spirulina platensis)', 'Spiruline (Spirulina platensis) en poudre, enveloppe de capsule.', 'Complément alimentaire à base de spiruline, micro-algue riche en protéines, fer, vitamines du groupe B et antioxydants. Aide à lutter contre la fatigue et soutient la vitalité. Capsules de 500 mg.'),
('V', 'VST-003', 'Amla 500 mg', NULL, 8000, 'Capsule', '500 mg', 'Amla (Emblica officinalis)', 'Extrait de fruit d''Amla (groseille indienne, Emblica officinalis), enveloppe de capsule.', 'Complément alimentaire à base d''Amla, l''une des plus riches sources naturelles de vitamine C. Soutient l''immunité, la digestion et la protection antioxydante. Capsules de 500 mg.'),
('V', 'VST-004', 'Aloe Vera 500 mg', NULL, 8000, 'Capsule', '500 mg', 'Aloe Vera (Aloe barbadensis)', 'Extrait d''Aloe Vera (Aloe barbadensis), enveloppe de capsule.', 'Complément alimentaire à base d''Aloe Vera, traditionnellement utilisé pour favoriser le confort digestif, l''hydratation et le bien-être général. Capsules de 500 mg.'),
('V', 'VST-005', 'Neem 0.25 ml', 'Neem 0,25 ml', 9000, 'Capsule', '0,25 ml', 'Neem (Azadirachta indica)', 'Extrait de feuilles de Neem (Azadirachta indica).', 'Complément alimentaire à base de Neem, plante traditionnelle reconnue pour ses propriétés purifiantes. Contribue à la détoxification de l''organisme et à l''équilibre de la peau. Dosage indiqué : 0,25 ml.'),
('V', 'VST-006', 'Ganoderma 425 mg', NULL, 18500, 'Capsule', '425 mg', 'Ganoderma (Ganoderma lucidum)', 'Extrait de Ganoderma lucidum (Reishi), enveloppe de capsule.', 'Complément alimentaire à base de Ganoderma lucidum (champignon Reishi), apprécié pour soutenir l''immunité, la vitalité et la résistance au stress. Capsules de 425 mg.'),
('V', 'VST-007', 'Flax Oil 500 mg', NULL, 12500, 'Capsule molle', '500 mg', 'Huile de lin (Linum usitatissimum)', 'Huile de graines de lin (source d''acide alpha-linolénique, oméga-3), enveloppe de capsule molle.', 'Complément alimentaire à base d''huile de lin, riche en oméga-3 d''origine végétale. Soutient la santé cardiovasculaire, la fonction cérébrale et le confort articulaire. Capsules molles de 500 mg.'),
('V', 'VST-008', 'Glucosamine 450 mg', NULL, 14500, 'Comprimé', '450 mg', 'Glucosamine', 'Glucosamine.', 'Complément alimentaire à base de glucosamine, constituant naturel du cartilage. Favorise le confort et la mobilité des articulations. Comprimés de 450 mg.'),
('V', 'VST-009', 'Folic & Iron Plus', 'Folic and Iron Plus', 7500, 'Comprimé', 'Selon notice', 'Fer, acide folique', 'Fer, acide folique (vitamine B9), vitamines et minéraux associés.', 'Complément alimentaire associant fer et acide folique. Contribue à la formation des globules rouges, à la réduction de la fatigue et au bon déroulement de la grossesse.'),
('V', 'VST-010', 'Prime Krill Oil 500 mg 30', 'Prime Krill Oil 500 mg', 22500, 'Capsule molle', '500 mg - 30 capsules', 'Huile de krill (Euphausia superba)', 'Huile de krill (phospholipides, oméga-3 EPA et DHA, astaxanthine).', 'Complément alimentaire premium à base d''huile de krill, riche en oméga-3 EPA/DHA sous forme de phospholipides et en astaxanthine. Soutient le cœur, le cerveau et les articulations. Boîte de 30 capsules de 500 mg.'),
('V', 'VST-011', 'Calcium 625 mg 100', 'Calcium 625 mg', 7500, 'Comprimé', '625 mg - 100 comprimés', 'Calcium', 'Calcium.', 'Complément alimentaire à base de calcium. Contribue au maintien d''une ossature et d''une dentition normales. Boîte de 100 comprimés de 625 mg.'),
('V', 'VST-012', 'Coenzyme Q10', NULL, 17000, 'Capsule molle', 'Selon notice', 'Coenzyme Q10 (ubiquinone)', 'Coenzyme Q10 (ubiquinone).', 'Complément alimentaire à base de coenzyme Q10, antioxydant naturel impliqué dans la production d''énergie cellulaire. Soutient la santé cardiovasculaire et la vitalité.'),
('V', 'VST-013', 'Veslim Shake - Mango Flavour', NULL, 24000, 'Poudre', 'Selon notice', 'Protéines, fibres, vitamines et minéraux', 'Mélange de protéines, fibres, vitamines et minéraux, arôme mangue.', 'Substitut de repas en poudre Vestige Veslim, saveur mangue. Riche en protéines et en fibres, il aide à la gestion du poids dans le cadre d''un régime équilibré.'),
('V', 'VST-014', 'ENGRAIS AGRI 82 500 ml', NULL, 21000, 'Liquide', '500 ml', 'Nutriments végétaux', 'Engrais agricole liquide Vestige Agri 82.', 'Engrais liquide Vestige Agri 82 pour cultures. Favorise la croissance et le rendement des plantes. Flacon de 500 ml. Produit à usage agricole, non destiné à la consommation.'),
('V', 'VST-015', 'ENGRAIS AGRI HUMIC 500 ml', NULL, 21000, 'Liquide', '500 ml', 'Acides humiques', 'Acides humiques.', 'Engrais liquide Vestige Agri Humic enrichi en acides humiques. Améliore la structure et la fertilité du sol et stimule le développement racinaire. Flacon de 500 ml. Usage agricole uniquement.'),
('V', 'VST-016', 'ENGRAIS AGRI HUMIC Granulés 5 kg', NULL, 31000, 'Granulés', '5 kg', 'Acides humiques', 'Acides humiques sous forme de granulés.', 'Engrais en granulés Vestige Agri Humic enrichi en acides humiques. Améliore la fertilité du sol et la croissance des cultures. Sac de 5 kg. Usage agricole uniquement.'),
('V', 'VST-017', 'Colostrum', 'Vestige Colostrum', 17000, 'Capsule', 'Selon notice', 'Colostrum bovin', 'Colostrum bovin.', 'Complément alimentaire à base de colostrum, riche en immunoglobulines et facteurs de croissance. Soutient les défenses immunitaires et l''équilibre intestinal.'),
('V', 'VST-018', 'Grand Bary', NULL, 36000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage du produit.', 'Complément alimentaire de la gamme Vestige. Produit au tarif client de 36 000 FCFA ; se référer à l''emballage pour la composition et le mode d''emploi.'),
('V', 'VST-019', 'FIBER', 'Vestige Fiber', 21000, 'Poudre', 'Selon notice', 'Fibres alimentaires', 'Fibres alimentaires solubles et insolubles.', 'Complément alimentaire riche en fibres alimentaires. Favorise le transit intestinal, la satiété et l''équilibre digestif.'),
('V', 'VST-020', 'L-Arginine 10 g', 'L-Argine 10 g', 31000, 'Poudre', '10 g', 'L-Arginine', 'L-Arginine.', 'Complément alimentaire à base de L-arginine, acide aminé précurseur de l''oxyde nitrique. Soutient la circulation sanguine, l''endurance et la vitalité. Dosage de 10 g.'),
('V', 'VST-021', 'Vestige Veslim Tea and Green Coffee', NULL, 22000, 'Infusion', 'Selon notice', 'Thé vert, café vert', 'Thé vert, extrait de café vert.', 'Mélange de thé vert et de café vert Vestige Veslim, riche en antioxydants. Accompagne la gestion du poids et le métabolisme dans le cadre d''une alimentation équilibrée.'),
('V', 'VST-022', 'Vestige Veslim Capsule', NULL, 23000, 'Capsule', 'Selon notice', 'Extraits de plantes (gestion du poids)', 'Extraits de plantes pour la gestion du poids.', 'Capsules Vestige Veslim, complément alimentaire pour accompagner la gestion du poids avec un régime équilibré et une activité physique régulière.'),
('V', 'VST-023', 'Eye Support', NULL, 17000, 'Capsule', 'Selon notice', 'Lutéine, vitamines et antioxydants', 'Lutéine, vitamines et antioxydants pour la vision.', 'Complément alimentaire pour le soutien de la vision et la protection des yeux contre le stress oxydatif et la fatigue visuelle.'),
('V', 'VST-024', 'Detox Foot Patches', NULL, 22500, 'Patch', 'Selon notice', 'Extraits de plantes', 'Extraits de plantes et minéraux.', 'Patchs de détoxification à appliquer sur la plante des pieds, pour le bien-être et la sensation de légèreté. Usage externe uniquement.'),
('V', 'VST-025', 'Prime Combiotics', NULL, 16500, 'Capsule', 'Selon notice', 'Probiotiques, prébiotiques', 'Probiotiques et prébiotiques.', 'Complément alimentaire Vestige Prime associant probiotiques et prébiotiques. Contribue à l''équilibre de la flore intestinale et au confort digestif.'),
('V', 'VST-026', 'Ayusante Prostate Care', NULL, 17500, 'Capsule', 'Selon notice', 'Extraits de plantes ayurvédiques', 'Extraits de plantes de la tradition ayurvédique.', 'Complément alimentaire Ayusante, formulé selon la tradition ayurvédique pour le bien-être de la prostate et du système urinaire masculin.'),
('V', 'VST-027', 'Ayusante Gluco Health', NULL, 15000, 'Capsule', 'Selon notice', 'Extraits de plantes ayurvédiques', 'Extraits de plantes de la tradition ayurvédique.', 'Complément alimentaire Ayusante pour soutenir l''équilibre de la glycémie dans le cadre d''une alimentation saine.'),
('V', 'VST-028', 'Ayusante Liverhealth', 'Ayusante Liver Health', 15000, 'Capsule', 'Selon notice', 'Extraits de plantes ayurvédiques', 'Extraits de plantes de la tradition ayurvédique.', 'Complément alimentaire Ayusante pour soutenir la fonction hépatique et la détoxification naturelle du foie.'),
('V', 'VST-029', 'Ultra Wash Liquid Laundry Detergent 500 ml', NULL, 10000, 'Liquide', '500 ml', 'Agents lavants', 'Tensioactifs, agents lavants.', 'Lessive liquide concentrée Vestige Ultra Wash. Élimine efficacement les taches et laisse le linge propre et frais. Flacon de 500 ml. Usage ménager.'),
('V', 'VST-030', 'Ultra Guard Toilet Cleaner 500 ml', NULL, 5000, 'Liquide', '500 ml', 'Agents nettoyants et désinfectants', 'Agents nettoyants, désinfectants.', 'Nettoyant pour toilettes Vestige Ultra Guard. Détartre, nettoie et assainit les cuvettes. Flacon de 500 ml. Usage ménager.'),
('V', 'VST-031', 'Ultra Scrub Dishwashing Liquid 500 ml', NULL, 5000, 'Liquide', '500 ml', 'Agents dégraissants', 'Tensioactifs, agents dégraissants.', 'Liquide vaisselle concentré Vestige Ultra Scrub. Dégraisse efficacement et respecte les mains. Flacon de 500 ml.'),
('V', 'VST-032', 'Zeta Tea', NULL, 7000, 'Infusion', 'Selon notice', 'Thé et extraits de plantes', 'Thé et extraits de plantes.', 'Thé diététique Vestige Zeta, à consommer en infusion dans le cadre d''une alimentation équilibrée.'),
('V', 'VST-033', 'Zeta Coffee', 'Zeta Cofee', 5000, 'Poudre', 'Selon notice', 'Café', 'Café soluble.', 'Café diététique Vestige Zeta, à consommer chaud dans le cadre d''une alimentation équilibrée.'),
('V', 'VST-034', 'Assure Complexion Bar (Kesar, Olive & Honey) 75 g', NULL, 2000, 'Savon', '75 g', 'Safran (Kesar), huile d''olive, miel', 'Safran, huile d''olive, miel.', 'Savon de beauté Vestige Assure au safran, à l''huile d''olive et au miel. Nettoie en douceur et illumine le teint. Pain de 75 g.'),
('V', 'VST-035', 'Assure Daily Moisturiser 250 ml', NULL, 8000, 'Lotion', '250 ml', 'Agents hydratants', 'Agents hydratants et émollients.', 'Lotion hydratante quotidienne Vestige Assure pour le visage et le corps. Nourrit et adoucit la peau. Flacon de 250 ml.'),
('V', 'VST-036', 'Assure Body Wash', 'Assure BODY WASH', 7000, 'Gel', 'Selon notice', 'Agents lavants doux', 'Agents lavants doux.', 'Gel douche Vestige Assure. Nettoie en douceur et laisse la peau fraîche et parfumée.'),
('V', 'VST-037', 'Assure Hand Wash', 'Assure HAND WASH', 4000, 'Liquide', 'Selon notice', 'Agents lavants doux', 'Agents lavants doux.', 'Lave-mains liquide Vestige Assure. Nettoie efficacement tout en préservant la douceur des mains.'),
('V', 'VST-038', 'Dentassure Gano Toothpaste 100 g', NULL, 3500, 'Dentifrice', '100 g', 'Ganoderma, fluorure', 'Extrait de Ganoderma, agents nettoyants.', 'Dentifrice Vestige Dentassure au Ganoderma. Aide à protéger les dents et les gencives et assure une haleine fraîche. Tube de 100 g.'),
('V', 'VST-039', 'Assure Purifying Cleanser + Toner 250 ml', NULL, 8000, 'Lotion', '250 ml', 'Agents purifiants', 'Agents purifiants et tonifiants.', 'Nettoyant et tonique 2 en 1 Vestige Assure pour le visage. Élimine les impuretés et resserre les pores. Flacon de 250 ml.'),
('V', 'VST-040', 'Parfum de poche (Assure Blossom Perfume)', 'Parfum poche (Assure Blossom perfum)', 3500, 'Parfum', 'Selon notice', 'Parfum', 'Alcool, parfum.', 'Parfum de poche Vestige Assure Blossom, format compact et pratique, à fragrance florale.'),
('V', 'VST-041', 'Assure Perfume Spray Arctic', 'Assure Perfum spray Artic', 8000, 'Spray', 'Selon notice', 'Parfum', 'Alcool, parfum.', 'Parfum en spray Vestige Assure, fragrance Arctic fraîche et durable.'),
('V', 'VST-042', 'Assure Rapture Deo Women', NULL, 8000, 'Spray', 'Selon notice', 'Agents déodorants', 'Agents déodorants, parfum.', 'Déodorant pour femme Vestige Assure Rapture. Procure une protection fraîche et durable contre les odeurs.'),
('V', 'VST-043', 'Assure Mild Exfoliating Face Scrub 60 g', NULL, 6500, 'Gommage', '60 g', 'Agents exfoliants doux', 'Agents exfoliants doux.', 'Gommage exfoliant doux pour le visage Vestige Assure. Élimine les cellules mortes et affine le grain de peau. Tube de 60 g.'),
('V', 'VST-044', 'Assure Anti-Ageing Night Cream 60 g', NULL, 6500, 'Crème', '60 g', 'Agents nourrissants anti-âge', 'Agents nourrissants, antioxydants.', 'Crème de nuit anti-âge Vestige Assure. Nourrit la peau pendant la nuit et aide à atténuer les signes de l''âge. Pot de 60 g.'),
('V', 'VST-045', 'Assure Clarifying Face Wash 60 g', NULL, 5000, 'Gel', '60 g', 'Agents nettoyants clarifiants', 'Agents nettoyants clarifiants.', 'Nettoyant clarifiant pour le visage Vestige Assure. Purifie la peau et élimine l''excès de sébum. Tube de 60 g.'),
('V', 'VST-046', 'DewGarden Sanitary (Serviette Hygiénique)', NULL, 3500, 'Serviette hygiénique', 'Selon notice', 'Coton, cellulose', 'Matières absorbantes.', 'Serviettes hygiéniques Vestige DewGarden, absorbantes et confortables pour une protection fiable au quotidien.'),
('V', 'VST-047', 'Poudre femme (Echant Body Talc)', 'Poudre femme (Echant body talc)', 3000, 'Poudre', 'Selon notice', 'Talc', 'Talc, parfum.', 'Poudre talquée Vestige Echant pour femme. Absorbe l''humidité et laisse une sensation de fraîcheur et de douceur.'),
('V', 'VST-048', 'Foot Cream', NULL, 5000, 'Crème', 'Selon notice', 'Agents hydratants', 'Agents hydratants et adoucissants.', 'Crème pour les pieds Vestige. Hydrate, adoucit et aide à prévenir les talons secs et gercés.'),
('V', 'VST-049', 'Assure Soap', NULL, 2000, 'Savon', 'Selon notice', 'Agents lavants doux', 'Agents lavants doux.', 'Savon de toilette Vestige Assure pour le nettoyage quotidien du corps.'),
('V', 'VST-050', 'Ayusante Toxclean', NULL, 18000, 'Capsule', 'Selon notice', 'Extraits de plantes ayurvédiques', 'Extraits de plantes de la tradition ayurvédique.', 'Complément alimentaire Ayusante pour soutenir la détoxification naturelle de l''organisme.'),
('V', 'VST-051', 'Vestige Prime Concentrated Mineral Drops (CMD)', 'Vestige Prime CMD', 25000, 'Gouttes', 'Selon notice', 'Minéraux concentrés', 'Minéraux concentrés.', 'Gouttes minérales concentrées Vestige Prime pour compléter les apports en minéraux et oligo-éléments.'),
('V', 'VST-052', 'Vestige Shatavari Max', NULL, 18500, 'Capsule', 'Selon notice', 'Shatavari (Asparagus racemosus)', 'Extrait de Shatavari (Asparagus racemosus).', 'Complément alimentaire à base de Shatavari, plante ayurvédique traditionnellement utilisée pour le bien-être féminin et l''équilibre hormonal.'),
('V', 'VST-053', 'Vestige Prime Energy Booster', NULL, 23000, 'Complément alimentaire', 'Selon notice', 'Extraits de plantes, vitamines', 'Extraits de plantes et vitamines énergisantes.', 'Complément alimentaire Vestige Prime pour soutenir l''énergie, la vitalité et réduire la sensation de fatigue.'),
('V', 'VST-054', 'Ayusante Kidneyhealth', 'Ayusante Kidney Health', 18000, 'Capsule', 'Selon notice', 'Extraits de plantes ayurvédiques', 'Extraits de plantes de la tradition ayurvédique.', 'Complément alimentaire Ayusante pour soutenir la fonction rénale et le bon équilibre du système urinaire.'),
('V', 'VST-055', 'Ayusante Vital Complex', NULL, 18000, 'Capsule', 'Selon notice', 'Extraits de plantes, vitamines', 'Extraits de plantes, vitamines et minéraux.', 'Complexe Ayusante de vitamines, minéraux et plantes pour la vitalité et le bien-être général.'),
('V', 'VST-056', 'Vestige Collagen', NULL, 15000, 'Poudre', 'Selon notice', 'Collagène', 'Collagène hydrolysé.', 'Complément alimentaire à base de collagène. Soutient l''élasticité de la peau, la santé des cheveux, des ongles et des articulations.'),
('V', 'VST-057', 'Ayusante Respocare', NULL, 18000, 'Capsule', 'Selon notice', 'Extraits de plantes ayurvédiques', 'Extraits de plantes de la tradition ayurvédique.', 'Complément alimentaire Ayusante pour soutenir le confort respiratoire et le bien-être des voies respiratoires.'),
('V', 'VST-058', 'Vestige Prime Absorvit Vitamin C Sublingual Spray', NULL, 18000, 'Spray sublingual', 'Selon notice', 'Vitamine C', 'Vitamine C (acide ascorbique).', 'Spray sublingual de vitamine C Vestige Prime Absorvit, à absorption rapide. Soutient les défenses immunitaires et la protection antioxydante.'),
('V', 'VST-059', 'VESTIGE PRIME ABSORVIT MELATONIN', 'Vestige Prime Absorvit Melatonin', 19000, 'Spray sublingual', 'Selon notice', 'Mélatonine', 'Mélatonine.', 'Spray sublingual de mélatonine Vestige Prime Absorvit, à absorption rapide. Aide à réduire le temps d''endormissement et à favoriser un sommeil réparateur.'),
('V', 'VST-060', 'Vestige Prime Absorvit Vitamin B12', NULL, 19000, 'Spray sublingual', 'Selon notice', 'Vitamine B12 (cobalamine)', 'Vitamine B12 (cobalamine).', 'Spray sublingual de vitamine B12 Vestige Prime Absorvit. Contribue à réduire la fatigue et au bon fonctionnement du système nerveux.'),
('V', 'VST-061', 'Vestige Curcumin Plus', NULL, 23000, 'Capsule', 'Selon notice', 'Curcumine (Curcuma longa), pipérine', 'Extrait de curcuma (curcumine), pipérine pour une meilleure absorption.', 'Complément alimentaire à base de curcumine, antioxydant naturel. Soutient le confort articulaire et la santé générale.'),
('V', 'VST-062', 'Vescare Insta Relief Cream', NULL, 5000, 'Crème', 'Selon notice', 'Extraits de plantes, huiles essentielles', 'Extraits de plantes et huiles essentielles.', 'Crème Vescare à application locale pour le confort musculaire et articulaire. Usage externe uniquement.'),
('V', 'VST-063', 'Vestige Prime Sea Buckthorn', NULL, 23000, 'Capsule', 'Selon notice', 'Argousier (Hippophae rhamnoides)', 'Extrait d''argousier (Hippophae rhamnoides).', 'Complément alimentaire Vestige Prime à base d''argousier, riche en oméga-7, vitamines et antioxydants. Soutient les défenses naturelles et la santé de la peau.'),
('F', 'FOR-001', 'Aloe Vera Gel', NULL, 19500, 'Boisson', '1 L', 'Aloe Vera (Aloe barbadensis) 99,7 %', 'Pulpe d''Aloe Vera stabilisée 99,7 %, acide citrique, acide ascorbique (vitamine C), arôme naturel.', 'Boisson Forever Aloe Vera Gel, pur gel d''Aloe Vera à boire stabilisé. Soutient la digestion, l''hydratation et le bien-être général. Bouteille de 1 litre.'),
('F', 'FOR-002', 'Aloe Berry Nectar', NULL, 19500, 'Boisson', '1 L', 'Aloe Vera, pomme, canneberge', 'Gel d''Aloe Vera, jus de pomme, jus de canneberge, miel, arôme naturel.', 'Boisson Forever Aloe Berry Nectar : gel d''Aloe Vera associé à la pomme et à la canneberge. Goût fruité agréable pour le confort digestif et urinaire. Bouteille de 1 litre.'),
('F', 'FOR-003', 'Aloe Bits N'' Peaches', 'Aloe Bits N Peaches', 19500, 'Boisson', '1 L', 'Aloe Vera, pêche', 'Gel d''Aloe Vera, morceaux d''Aloe, jus de pêche, arôme naturel.', 'Boisson Forever Aloe Bits N'' Peaches : gel d''Aloe Vera avec des morceaux d''Aloe et du jus de pêche. Bouteille de 1 litre.'),
('F', 'FOR-004', 'Forever Freedom', NULL, 28500, 'Boisson', '1 L', 'Aloe Vera, glucosamine, chondroïtine, MSM', 'Gel d''Aloe Vera, glucosamine, sulfate de chondroïtine, MSM, vitamine C.', 'Boisson Forever Freedom à base d''Aloe Vera, de glucosamine, de chondroïtine et de MSM. Soutient la mobilité et le confort des articulations. Bouteille de 1 litre.'),
('F', 'FOR-005', 'Aloe Blossom Herbal Tea', NULL, 13500, 'Infusion', 'Selon notice', 'Aloe Vera, camomille, menthe, hibiscus', 'Feuilles de plantes, extrait d''Aloe Vera.', 'Infusion Forever Aloe Blossom Herbal Tea, mélange de plantes et d''Aloe Vera, sans caféine, à déguster chaud ou froid.'),
('F', 'FOR-006', 'Pomesteen Power', NULL, 18500, 'Boisson', '1 L', 'Grenade, mangoustan, raisin, cerise', 'Jus de grenade, mangoustan, myrtille, framboise, raisin, pomme.', 'Boisson antioxydante Forever Pomesteen Power, mélange de grenade, mangoustan, raisin et baies. Bouteille de 1 litre.'),
('F', 'FOR-007', 'FAB', 'Forever FAB', 3500, 'Boisson énergisante', 'Selon notice', 'Aloe Vera, taurine, caféine', 'Eau, extrait d''Aloe Vera, taurine, caféine, vitamines B.', 'Forever Active Boost (FAB), boisson énergisante à l''Aloe Vera, pour un regain de tonus et de concentration.'),
('F', 'FOR-008', 'Forever Nature-Min', NULL, 14000, 'Comprimé', 'Selon notice', 'Minéraux (calcium, magnésium, zinc, cuivre), extraits de plantes', 'Minéraux (calcium, magnésium, fer), extraits de plantes et d''algues.', 'Complément alimentaire minéral Forever Nature-Min. Contribue à l''équilibre minéral de l''organisme et à la vitalité.'),
('F', 'FOR-009', 'Forever Absorbant-C', NULL, 13500, 'Comprimé', 'Selon notice', 'Vitamine C, fibres d''avoine', 'Vitamine C (acide ascorbique), fibres d''avoine.', 'Complément alimentaire de vitamine C à libération progressive Forever Absorbent-C. Soutient les défenses immunitaires.'),
('F', 'FOR-010', 'Forever Garlic-Thyme', NULL, 14000, 'Capsule molle', 'Selon notice', 'Ail, thym', 'Huile d''ail, huile de thym.', 'Complément alimentaire Forever Garlic-Thyme, ail et thym sans odeur. Soutient la santé cardiovasculaire et les défenses naturelles.'),
('F', 'FOR-011', 'Forever Fields of Greens', NULL, 10000, 'Comprimé', 'Selon notice', 'Orge, blé, luzerne, piment', 'Orge, blé, luzerne, piment.', 'Complément alimentaire Forever Fields of Greens, mélange de plantes vertes (orge, blé, luzerne). Apporte vitamines, minéraux et chlorophylle.'),
('F', 'FOR-012', 'Forever Garcinia Plus', NULL, 21500, 'Capsule molle', 'Selon notice', 'Garcinia cambogia, Aloe Vera', 'Extrait de Garcinia cambogia, huile de pépins de raisin, Aloe Vera.', 'Complément alimentaire Forever Garcinia Plus pour accompagner la gestion du poids avec une alimentation équilibrée.'),
('F', 'FOR-013', 'Forever Lycium Plus', NULL, 23500, 'Comprimé', 'Selon notice', 'Lycium, réglisse, Schizandra', 'Lycium (goji), réglisse, Schizandra, Dong Quai.', 'Complément alimentaire Forever Lycium Plus, mélange de plantes de la médecine traditionnelle chinoise pour la vitalité.'),
('F', 'FOR-014', 'Forever B12', NULL, 12000, 'Comprimé', 'Selon notice', 'Vitamine B12, acide folique', 'Vitamine B12, acide folique, Aloe Vera.', 'Complément alimentaire Forever B12 à base de vitamine B12 et d''acide folique. Contribue à réduire la fatigue et à soutenir le système nerveux.'),
('F', 'FOR-015', 'Forever Calcium', NULL, 19000, 'Comprimé', 'Selon notice', 'Calcium, magnésium, vitamine D3', 'Carbonate de calcium, magnésium, vitamine D3.', 'Complément alimentaire Forever Calcium. Contribue au maintien d''une ossature et d''une dentition normales.'),
('F', 'FOR-016', 'Forever Multi-Maca', NULL, 21000, 'Comprimé', 'Selon notice', 'Maca (Lepidium meyenii), extraits de plantes', 'Poudre de Maca, extraits de plantes, vitamines.', 'Complément alimentaire Forever Multi-Maca à base de Maca. Soutient l''énergie, l''endurance et la vitalité.'),
('F', 'FOR-017', 'Forever Active HA', NULL, 26500, 'Capsule molle', 'Selon notice', 'Acide hyaluronique, Aloe Vera', 'Acide hyaluronique, extrait d''Aloe Vera.', 'Complément alimentaire Forever Active HA à base d''acide hyaluronique. Soutient la lubrification et la souplesse des articulations.'),
('F', 'FOR-018', 'Forever Lean', NULL, 32500, 'Capsule', 'Selon notice', 'Extrait de haricot blanc, chrome, Aloe Vera', 'Extrait de haricot blanc, picolinate de chrome, Aloe Vera.', 'Complément alimentaire Forever Lean pour accompagner la gestion du poids et le métabolisme des glucides et des graisses.'),
('F', 'FOR-019', 'Forever Cardio Health', NULL, 27000, 'Capsule', 'Selon notice', 'Phytostérols, oméga-3', 'Phytostérols, huile de poisson (oméga-3).', 'Complément alimentaire Forever Cardio Health pour soutenir la santé cardiovasculaire et un cholestérol normal.'),
('F', 'FOR-020', 'Forever Kids Multivitamins', NULL, 11500, 'Comprimé à croquer', 'Selon notice', 'Vitamines et minéraux', 'Vitamines, minéraux, arôme fruité.', 'Multivitamines à croquer Forever Kids pour accompagner la croissance et la vitalité des enfants.'),
('F', 'FOR-021', 'Forever Immublend', NULL, 18000, 'Comprimé', 'Selon notice', 'Vitamines C, D, E, zinc, extraits de plantes', 'Vitamines, zinc, sélénium, extraits de champignons.', 'Complément alimentaire Forever Immublend pour soutenir les défenses immunitaires.'),
('F', 'FOR-022', 'Vitolize Men', NULL, 24000, 'Capsule', 'Selon notice', 'Extraits de plantes pour la santé de la prostate', 'Extraits de pépins de courge, graines de lin, lycopène, zinc.', 'Complément alimentaire Forever Vitolize Men, formulé pour la santé de l''homme, en particulier de la prostate.'),
('F', 'FOR-023', 'Vitolize Women', NULL, 25000, 'Capsule', 'Selon notice', 'Extraits de plantes pour le bien-être féminin', 'Extraits de plantes, vitamines et minéraux.', 'Complément alimentaire Forever Vitolize Women, formulé pour l''équilibre et le bien-être féminin.'),
('F', 'FOR-024', 'Forever Arctic Sea', NULL, 24000, 'Capsule molle', '60 capsules', 'Huile de poisson, huile d''olive', 'Huile de poisson riche en oméga-3 (EPA, DHA), huile d''olive.', 'Complément alimentaire Forever Arctic Sea, oméga-3 EPA et DHA. Soutient le cœur, le cerveau et la vision.'),
('F', 'FOR-025', 'Forever Daily', NULL, 15500, 'Comprimé', 'Selon notice', 'Multivitamines et minéraux', 'Vitamines A, C, D, E, B, minéraux.', 'Complément multivitaminé et minéral Forever Daily pour un apport quotidien en nutriments essentiels.'),
('F', 'FOR-026', 'Forever Therm', NULL, 22000, 'Comprimé', 'Selon notice', 'Extrait de thé vert, caféine, vitamines B', 'Extrait de thé vert, caféine, vitamines B.', 'Complément alimentaire Forever Therm pour soutenir le métabolisme et la gestion du poids.'),
('F', 'FOR-027', 'Forever Fiber', NULL, 22000, 'Poudre', 'Selon notice', 'Fibres (inuline, pectine, bêta-glucane)', 'Fibres, inuline, pectine.', 'Complément alimentaire riche en fibres, Forever Fiber. Soutient le transit intestinal et la satiété.'),
('F', 'FOR-028', 'Lite Ultra Van W/Amin - 15 Serving', 'Forever Lite Ultra Vanilla', 24000, 'Poudre', '15 portions', 'Protéines de soja, acides aminés', 'Protéine de soja, acides aminés, vitamines et minéraux, arôme vanille.', 'Shake protéiné Forever Lite Ultra saveur vanille avec acides aminés. Utilisé dans les programmes de contrôle du poids. 15 portions.'),
('F', 'FOR-029', 'Lite Ultra Choc W/Amin - 15 Serving', 'Forever Lite Ultra Chocolate', 24000, 'Poudre', '15 portions', 'Protéines de soja, acides aminés', 'Protéine de soja, acides aminés, vitamines et minéraux, arôme chocolat.', 'Shake protéiné Forever Lite Ultra saveur chocolat avec acides aminés. Utilisé dans les programmes de contrôle du poids. 15 portions.'),
('F', 'FOR-030', 'Argi+ Enhanced Stick', 'Forever Argi+', 59500, 'Sachet', 'Selon notice', 'L-Arginine, L-Citrulline, vitamines', 'L-Arginine, L-Citrulline, vitamines C, D, K, B6, B12, extrait de raisin.', 'Complément alimentaire Forever Argi+ en sachets-sticks, à base de L-arginine. Soutient l''énergie, la circulation sanguine et la vitalité.'),
('F', 'FOR-031', 'Forever Fast Break', NULL, 4000, 'Barre énergétique', 'Selon notice', 'Protéines, avoine, miel', 'Protéines, avoine, miel, fruits à coque.', 'Barre énergétique Forever Fast Break, riche en protéines, pour un en-cas équilibré.'),
('F', 'FOR-032', 'Forever Move', NULL, 49000, 'Capsule', 'Selon notice', 'Collagène non dénaturé de type II, curcuma', 'Collagène de type II, extrait de curcuma.', 'Complément alimentaire Forever Move pour la mobilité, le confort et la souplesse des articulations.'),
('F', 'FOR-033', 'Forever Active Pro-B', NULL, 28500, 'Capsule', 'Selon notice', 'Probiotiques (Lactobacilles, Bifidobactéries)', 'Probiotiques, prébiotiques.', 'Complément alimentaire Forever Active Pro-B à base de probiotiques. Soutient la flore intestinale et les défenses naturelles.'),
('F', 'FOR-034', 'Forever Supergreens', NULL, 30000, 'Poudre', 'Selon notice', 'Plantes vertes, fruits et légumes', 'Poudre de plantes vertes, fruits et légumes, vitamines.', 'Complément alimentaire Forever Supergreens, mélange de superaliments verts pour compléter l''alimentation quotidienne.'),
('F', 'FOR-035', 'Forever iVision', NULL, 28500, 'Capsule', 'Selon notice', 'Lutéine, zéaxanthine, vitamines', 'Lutéine, zéaxanthine, vitamines, myrtille.', 'Complément alimentaire Forever iVision pour la santé de la vision et la protection contre la fatigue visuelle.'),
('F', 'FOR-036', 'Mini Touch Nutritional', NULL, 197000, 'Pack', 'Pack', 'Voir composition du pack', 'Voir composition du pack Forever Mini Touch Nutritional.', 'Pack Forever Mini Touch Nutritional, assortiment de produits nutritionnels. La composition détaillée n''est pas précisée dans la grille tarifaire ; se référer au catalogue Forever.'),
('F', 'FOR-037', 'Mini Touch Personal', NULL, 197000, 'Pack', 'Pack', 'Voir composition du pack', 'Voir composition du pack Forever Mini Touch Personal.', 'Pack Forever Mini Touch Personal, assortiment de produits de soins personnels. La composition détaillée n''est pas précisée dans la grille tarifaire ; se référer au catalogue Forever.'),
('F', 'FOR-038', 'Vital 5 with Gel', NULL, 202500, 'Pack', 'Pack', 'Voir composition du pack', 'Voir composition du pack Forever Vital 5.', 'Pack Forever Vital 5 avec Aloe Vera Gel : programme de 5 produits essentiels de Forever. La composition détaillée n''est pas précisée dans la grille tarifaire.'),
('F', 'FOR-039', 'Vital 5 with Berry Nectar', NULL, 202500, 'Pack', 'Pack', 'Voir composition du pack', 'Voir composition du pack Forever Vital 5.', 'Pack Forever Vital 5 avec Aloe Berry Nectar : programme de 5 produits essentiels de Forever. La composition détaillée n''est pas précisée dans la grille tarifaire.'),
('F', 'FOR-040', 'Vital 5 with Bits N Peaches', NULL, 202500, 'Pack', 'Pack', 'Voir composition du pack', 'Voir composition du pack Forever Vital 5.', 'Pack Forever Vital 5 avec Aloe Bits N'' Peaches : programme de 5 produits essentiels de Forever. La composition détaillée n''est pas précisée dans la grille tarifaire.'),
('F', 'FOR-041', 'Vital 5 with Freedom', NULL, 238000, 'Pack', 'Pack', 'Voir composition du pack', 'Voir composition du pack Forever Vital 5.', 'Pack Forever Vital 5 avec Forever Freedom : programme de 5 produits essentiels de Forever. La composition détaillée n''est pas précisée dans la grille tarifaire.'),
('F', 'FOR-042', 'Forever Bee Pollen', NULL, 11500, 'Comprimé', 'Selon notice', 'Pollen d''abeille', 'Pollen d''abeille, miel.', 'Complément alimentaire Forever Bee Pollen, concentré naturel de nutriments. Soutient l''énergie et la vitalité.'),
('F', 'FOR-043', 'Forever Bee Propolis', NULL, 25500, 'Comprimé', 'Selon notice', 'Propolis', 'Propolis, miel.', 'Complément alimentaire Forever Bee Propolis, riche en antioxydants. Soutient les défenses naturelles.'),
('F', 'FOR-044', 'Forever Royal Jelly', NULL, 25500, 'Comprimé', 'Selon notice', 'Gelée royale', 'Gelée royale lyophilisée.', 'Complément alimentaire Forever Royal Jelly, gelée royale pour l''énergie et la vitalité.'),
('F', 'FOR-045', 'Forever Bee Honey', NULL, 13500, 'Miel', 'Selon notice', 'Miel pur', 'Miel d''abeille pur.', 'Miel pur Forever Bee Honey, source naturelle d''énergie, à utiliser comme édulcorant ou en collation.'),
('F', 'FOR-046', 'Clean9 - Ultra Van', 'Clean 9 Ultra Vanilla', 91500, 'Pack', 'Programme de 9 jours', 'Programme de détox et de gestion du poids', 'Gel d''Aloe Vera, Forever Lite Ultra (vanille), Forever Therm, Forever Garcinia Plus, Forever Fiber.', 'Programme Forever Clean 9 avec Lite Ultra saveur vanille. Programme de 9 jours pour une alimentation saine et la gestion du poids.'),
('F', 'FOR-047', 'Clean9 - Ultra Choc', 'Clean 9 Ultra Chocolate', 91500, 'Pack', 'Programme de 9 jours', 'Programme de détox et de gestion du poids', 'Gel d''Aloe Vera, Forever Lite Ultra (chocolat), Forever Therm, Forever Garcinia Plus, Forever Fiber.', 'Programme Forever Clean 9 avec Lite Ultra saveur chocolat. Programme de 9 jours pour une alimentation saine et la gestion du poids.'),
('F', 'FOR-048', 'Fit15 1&2 Vanilla Lite Ultra', 'Fit 15 1 and 2 Vanilla Lite Ultra', 115000, 'Pack', 'Programme de 15 jours', 'Programme de gestion du poids', 'Forever Lite Ultra (vanille), gel d''Aloe Vera, Forever Therm, Forever Garcinia Plus, Forever Fiber.', 'Programme Forever F.I.T. 15 (étapes 1 et 2) avec Lite Ultra vanille, pour la gestion du poids et un mode de vie actif.'),
('F', 'FOR-049', 'Fit15 1&2 Chocolate Lite Ultra', 'Fit 15 1 and 2 Chocolate Lite Ultra', 115000, 'Pack', 'Programme de 15 jours', 'Programme de gestion du poids', 'Forever Lite Ultra (chocolat), gel d''Aloe Vera, Forever Therm, Forever Garcinia Plus, Forever Fiber.', 'Programme Forever F.I.T. 15 (étapes 1 et 2) avec Lite Ultra chocolat, pour la gestion du poids et un mode de vie actif.'),
('F', 'FOR-050', 'R3 Factor Skin Creme', 'R3 Factor Skin Cream', 25000, 'Crème', '56,7 g', 'Aloe Vera, bêta-carotène, vitamines', 'Gel d''Aloe Vera, extraits de plantes, vitamines A, C et E.', 'Crème Forever R3 Factor, soin anti-âge qui lisse, hydrate et redonne de l''éclat à la peau.'),
('F', 'FOR-051', 'Alpha-E Factor', NULL, 26000, 'Crème', '56,7 g', 'Vitamine E, Aloe Vera', 'Vitamine E, gel d''Aloe Vera, huiles végétales.', 'Crème Forever Alpha-E Factor, soin nourrissant riche en vitamine E pour hydrater et protéger la peau.'),
('F', 'FOR-052', 'Aloe Scrub', NULL, 12000, 'Gommage', '99 g', 'Aloe Vera, jojoba', 'Gel d''Aloe Vera, billes de jojoba, extraits de plantes.', 'Gommage doux Forever Aloe Scrub aux perles de jojoba. Exfolie la peau en douceur.'),
('F', 'FOR-053', 'Infinite Skin Care Kit', NULL, 127000, 'Pack', 'Kit', 'Voir composition du kit', 'Nettoyant, sérum, complexe raffermissant, crème de restauration.', 'Kit de soins Forever Infinite by Aloe Vera pour raffermir la peau et réduire les signes de l''âge.'),
('F', 'FOR-054', 'Infinite Hydrating Cleanser', NULL, 22000, 'Nettoyant', 'Selon notice', 'Aloe Vera, hydratants', 'Gel d''Aloe Vera, hydratants.', 'Nettoyant hydratant Forever Infinite pour nettoyer la peau en douceur.'),
('F', 'FOR-055', 'Infinite Firming Serum', NULL, 35000, 'Sérum', 'Selon notice', 'Aloe Vera, actifs raffermissants', 'Gel d''Aloe Vera, peptides, antioxydants.', 'Sérum raffermissant Forever Infinite pour une peau plus ferme et plus lisse.'),
('F', 'FOR-056', 'Infinite Firming Complex', NULL, 35000, 'Soin', 'Selon notice', 'Aloe Vera, actifs raffermissants', 'Gel d''Aloe Vera, peptides, antioxydants.', 'Complexe raffermissant Forever Infinite pour améliorer la fermeté et l''élasticité de la peau.'),
('F', 'FOR-057', 'Infinite Restoring Cream', NULL, 39000, 'Crème', 'Selon notice', 'Aloe Vera, huiles nourrissantes', 'Gel d''Aloe Vera, beurre de karité, huiles nourrissantes.', 'Crème Forever Infinite pour restaurer, nourrir et protéger la peau.'),
('F', 'FOR-058', 'Smoothing Exfoliator', NULL, 14000, 'Gommage', 'Selon notice', 'Aloe Vera, microbilles naturelles', 'Gel d''Aloe Vera, exfoliants naturels.', 'Exfoliant Forever Smoothing qui élimine les cellules mortes et affine le grain de peau.'),
('F', 'FOR-059', 'Balancing Toner', NULL, 17000, 'Lotion tonique', 'Selon notice', 'Aloe Vera, extraits de plantes', 'Gel d''Aloe Vera, camomille, concombre.', 'Lotion tonique Forever Balancing pour équilibrer et rafraîchir la peau.'),
('F', 'FOR-060', 'Eye Crème', 'Eye Cream', 14000, 'Crème', 'Selon notice', 'Aloe Vera, actifs hydratants', 'Gel d''Aloe Vera, extraits de plantes.', 'Crème contour des yeux Forever pour hydrater et atténuer les signes de fatigue.'),
('F', 'FOR-061', 'Aloe Activator', NULL, 13000, 'Gel', 'Selon notice', 'Aloe Vera', 'Gel d''Aloe Vera.', 'Forever Aloe Activator, gel d''Aloe Vera concentré pour préparer la peau avant les soins.'),
('F', 'FOR-062', 'Aloe First Spray', 'Forever Aloe First', 15500, 'Spray', '473 ml', 'Aloe Vera, allantoïne, propolis', 'Gel d''Aloe Vera, allantoïne, extraits de plantes.', 'Spray Forever Aloe First pour apaiser et hydrater la peau.'),
('F', 'FOR-063', 'Aloe Propolis Creme', 'Aloe Propolis Cream', 15000, 'Crème', '113 g', 'Aloe Vera, propolis', 'Gel d''Aloe Vera, propolis, cire d''abeille.', 'Crème Forever Aloe Propolis, soin protecteur et apaisant aux ingrédients naturels.'),
('F', 'FOR-064', 'Aloe Vera Gelly', 'Aloe Vera Gelly', 11000, 'Gel', '118 ml', 'Aloe Vera', 'Gel d''Aloe Vera, vitamine E.', 'Gel apaisant Forever Aloe Vera Gelly, pour hydrater la peau et la soulager après le soleil.'),
('F', 'FOR-065', 'Aloe Lotion', NULL, 11000, 'Lotion', '118 ml', 'Aloe Vera', 'Gel d''Aloe Vera, jojoba, vitamine E.', 'Lotion hydratante Forever Aloe Lotion pour le visage et le corps.'),
('F', 'FOR-066', 'Aloe Moisturizing Lotion', NULL, 11000, 'Lotion', '118 ml', 'Aloe Vera', 'Gel d''Aloe Vera, jojoba, collagène.', 'Lotion hydratante Forever Aloe Moisturizing Lotion pour une peau douce.'),
('F', 'FOR-067', 'Aloe Heat Lotion', NULL, 11000, 'Lotion', '118 ml', 'Aloe Vera, menthol, essence d''eucalyptus', 'Gel d''Aloe Vera, menthol, extraits de plantes.', 'Lotion chauffante Forever Aloe Heat Lotion pour masser et réchauffer en douceur.'),
('F', 'FOR-068', 'Forever Aloe MSM Gel', NULL, 18000, 'Gel', '118 ml', 'Aloe Vera, MSM', 'Gel d''Aloe Vera, MSM (méthylsulfonylméthane), glucosamine.', 'Gel de massage Forever Aloe MSM Gel pour soulager le confort des muscles et articulations. Usage externe.'),
('F', 'FOR-069', 'Aloe Bath Gelee', 'Aloe Bath Gelée', 14000, 'Gel douche', 'Selon notice', 'Aloe Vera', 'Gel d''Aloe Vera, agents lavants doux.', 'Gel douche Forever Aloe Bath Gelée, doux et hydratant pour le corps.'),
('F', 'FOR-070', 'Aloe Lips', NULL, 2500, 'Baume à lèvres', '4,25 g', 'Aloe Vera, jojoba, cire d''abeille', 'Aloe Vera, jojoba, cire d''abeille.', 'Baume Forever Aloe Lips pour protéger et nourrir les lèvres.'),
('F', 'FOR-071', 'Forever Bright Tooth Gel', NULL, 6000, 'Dentifrice', '130 g', 'Aloe Vera, propolis', 'Gel d''Aloe Vera, propolis, agents nettoyants.', 'Dentifrice Forever Bright Tooth Gel, sans fluor, à l''Aloe Vera et à la propolis.'),
('F', 'FOR-072', 'Aloe Ever-Shield Deodorant', NULL, 5500, 'Déodorant', '92 g', 'Aloe Vera', 'Gel d''Aloe Vera, extraits de plantes.', 'Déodorant Forever Aloe Ever-Shield, sans aluminium, pour une protection naturelle.'),
('F', 'FOR-073', 'Gentleman''s Pride', NULL, 11500, 'Après-rasage', 'Selon notice', 'Aloe Vera', 'Gel d''Aloe Vera, extraits de plantes.', 'Soin après-rasage Forever Gentleman''s Pride pour apaiser et hydrater la peau.'),
('F', 'FOR-074', 'Avocado Soap', NULL, 5000, 'Savon', '142 g', 'Avocat, Aloe Vera', 'Beurre d''avocat, Aloe Vera.', 'Savon Forever Avocado Face & Body Soap à l''avocat, nourrissant pour le visage et le corps.'),
('F', 'FOR-075', 'MPD 2X', NULL, 19500, 'Savon liquide / détergent', 'Selon notice', 'Agents nettoyants', 'Agents nettoyants concentrés.', 'Forever MPD 2X, nettoyant multi-usages concentré pour la maison.'),
('F', 'FOR-076', 'Hand Sanitizer', NULL, 3000, 'Gel hydroalcoolique', 'Selon notice', 'Alcool, Aloe Vera', 'Alcool, gel d''Aloe Vera.', 'Gel désinfectant pour les mains Forever Hand Sanitizer.'),
('F', 'FOR-077', 'Aloe Liquid Soap', NULL, 14500, 'Savon liquide', '473 ml', 'Aloe Vera', 'Gel d''Aloe Vera, agents lavants doux.', 'Savon liquide Forever Aloe Liquid Soap pour les mains, doux et hydratant.'),
('F', 'FOR-078', 'Aloe Jojoba Shampoo', NULL, 17000, 'Shampooing', '296 ml', 'Aloe Vera, jojoba', 'Gel d''Aloe Vera, huile de jojoba.', 'Shampooing Forever Aloe Jojoba, nettoie en douceur et nourrit le cuir chevelu.'),
('F', 'FOR-079', 'Aloe Jojoba Conditioner', NULL, 18000, 'Après-shampooing', '296 ml', 'Aloe Vera, jojoba', 'Gel d''Aloe Vera, huile de jojoba.', 'Après-shampooing Forever Aloe Jojoba pour démêler et nourrir les cheveux.'),
('F', 'FOR-080', 'Aloe Body Lotion', NULL, 17500, 'Lotion', 'Selon notice', 'Aloe Vera', 'Gel d''Aloe Vera, huiles hydratantes.', 'Lotion pour le corps Forever à l''Aloe Vera, hydratante et nourrissante.'),
('T', 'TIE-001', 'CALCIUM ADULTE (I)', 'Tiens Calcium Adulte', 15000, 'Sachet', '10 sachets', 'Calcium, vitamine D3', 'Calcium, vitamine D3.', 'Calcium Adulte (I) de la gamme Tiens. Contribue au maintien d''une ossature et d''une dentition normales chez l''adulte. Boîte de 10 sachets.'),
('T', 'TIE-002', 'CALCIUM METABOLIQUE (II)', 'Tiens Calcium Métabolique', 16500, 'Sachet', '10 sachets', 'Calcium, magnésium, vitamine D3', 'Calcium, magnésium, vitamine D3.', 'Calcium Métabolique (II) de la gamme Tiens, formulé pour les besoins en calcium en cas de métabolisme osseux accru. Boîte de 10 sachets.'),
('T', 'TIE-003', 'CALCIUM ENFANT (III)', 'Tiens Calcium Enfant', 15000, 'Sachet', '10 sachets', 'Calcium, vitamine D3', 'Calcium, vitamine D3.', 'Calcium Enfant (III) de la gamme Tiens, adapté à la croissance osseuse des enfants. Boîte de 10 sachets.'),
('T', 'TIE-004', 'LECITHINE+CALCIUM', 'Tiens Lécithine + Calcium', 7500, 'Capsule', '30 capsules', 'Lécithine de soja, calcium', 'Lécithine de soja, calcium.', 'Lécithine associée au calcium. Soutient la santé cardiovasculaire et le bon état osseux. Boîte de 30 capsules.'),
('T', 'TIE-005', 'THE EQUILIBRE', 'Thé Équilibre Tiens', 11500, 'Infusion', '40 sachets', 'Extraits de plantes', 'Extraits de plantes pour infusion.', 'Thé Équilibre de la gamme Tiens, infusion de plantes pour le confort digestif et l''équilibre du corps. Boîte de 40 sachets.'),
('T', 'TIE-006', 'BENEFICIAL Capsules', 'Tiens Beneficial', 31000, 'Capsule', '150 capsules', 'Extraits de plantes', 'Extraits de plantes de la pharmacopée traditionnelle.', 'Capsules Beneficial de la gamme Tiens, complément alimentaire pour le bien-être général. Flacon de 150 capsules.'),
('T', 'TIE-007', 'CORDYCEPS Capsules', 'Tiens Cordyceps', 30000, 'Capsule', '100 capsules', 'Cordyceps (Cordyceps sinensis)', 'Cordyceps (poudre de mycélium).', 'Cordyceps de la gamme Tiens. Soutient l''énergie, l''endurance et les défenses naturelles. Flacon de 100 capsules.'),
('T', 'TIE-008', 'VITALITY Softgels', 'Tiens Vitality', 20000, 'Capsule molle', '30 capsules', 'Extraits de plantes, huiles végétales', 'Extraits de plantes et d''huiles végétales.', 'Capsules molles Vitality de la gamme Tiens, pour soutenir l''énergie et la vitalité. Boîte de 30 capsules.'),
('T', 'TIE-009', 'ZINC Capsules', 'Tiens Zinc', 8000, 'Capsule', '60 capsules', 'Zinc', 'Zinc.', 'Zinc de la gamme Tiens. Contribue au bon fonctionnement du système immunitaire et à la santé de la peau. Flacon de 60 capsules.'),
('T', 'TIE-010', 'CHITOSAN Capsules', 'Tiens Chitosan', 25500, 'Capsule', '100 capsules', 'Chitosane', 'Chitosane.', 'Chitosane de la gamme Tiens. Complément alimentaire pour accompagner la gestion du poids et l''équilibre lipidique. Flacon de 100 capsules.'),
('T', 'TIE-011', 'VIGOR Capsules', 'Tiens Vigor', 35000, 'Capsule', '60 capsules', 'Extraits de plantes', 'Extraits de plantes traditionnelles.', 'Capsules Vigor de la gamme Tiens, complément alimentaire pour la vitalité masculine. Flacon de 60 capsules.'),
('T', 'TIE-012', 'THE SILHOUETTE', 'Thé Silhouette Tiens', 13000, 'Infusion', '40 sachets', 'Extraits de plantes', 'Extraits de plantes pour infusion.', 'Thé Silhouette de la gamme Tiens, infusion de plantes pour accompagner la gestion du poids. Boîte de 40 sachets.'),
('T', 'TIE-013', 'SPIRULINE Capsules', 'Tiens Spiruline', 23000, 'Capsule', '100 capsules', 'Spiruline (Spirulina platensis)', 'Spiruline en poudre.', 'Capsules de spiruline Tiens, riches en protéines, vitamines et minéraux. Flacon de 100 capsules.'),
('T', 'TIE-014', 'CORDYCAFE', 'Tiens Cordycafé', 10500, 'Café instantané', '12 sachets', 'Café, extrait de Cordyceps', 'Café, extrait de Cordyceps.', 'Cordycafé de la gamme Tiens, café instantané au Cordyceps. Boîte de 12 sachets.'),
('T', 'TIE-015', 'AURA ENERGY Stone', NULL, 35500, 'Accessoire bien-être', '1 pièce', 'Pierre d''énergie', 'Matériau minéral.', 'Pierre Aura Energy de la gamme Tiens, accessoire de bien-être. 1 pièce.'),
('T', 'TIE-016', 'FOS SIRUP', 'Tiens FOS Sirop', 10000, 'Sirop', '6 sachets', 'Fructo-oligosaccharides (FOS)', 'Fructo-oligosaccharides, eau.', 'Sirop FOS de la gamme Tiens, prébiotique pour soutenir le confort digestif et la flore intestinale. Boîte de 6 sachets.'),
('T', 'TIE-017', 'ORECARE (Toothpaste)', 'Tiens Orecare', 4500, 'Dentifrice', '1 pièce', 'Agents nettoyants, extraits de plantes', 'Agents nettoyants, extraits de plantes.', 'Dentifrice Orecare de la gamme Tiens pour l''hygiène bucco-dentaire quotidienne. 1 tube.'),
('T', 'TIE-018', 'VITAMINE B complex', 'Tiens Vitamine B Complex', 15500, 'Capsule', '120 capsules', 'Vitamines du groupe B', 'Vitamines B1, B2, B6, B12, niacine, acide pantothénique.', 'Complexe de vitamines du groupe B Tiens. Contribue à réduire la fatigue et au bon fonctionnement du système nerveux. Flacon de 120 capsules.'),
('T', 'TIE-019', 'BRIGHTENING Complexion Soap', 'Tiens Brightening Complexion Soap', 2500, 'Savon', '1 pièce', 'Agents lavants éclaircissants doux', 'Agents lavants doux, extraits de plantes.', 'Savon Brightening Complexion de la gamme Tiens, pour un teint plus uniforme et lumineux. 1 pièce.'),
('T', 'TIE-020', 'MILDLY REFRESH Skin Soap', 'Tiens Mildly Refresh Skin Soap', 2500, 'Savon', '1 pièce', 'Agents lavants doux', 'Agents lavants doux, extraits de plantes.', 'Savon Mildly Refresh Skin de la gamme Tiens, nettoyant doux et rafraîchissant. 1 pièce.'),
('T', 'TIE-021', 'DAY USE', 'Tiens Day Use', 3500, 'Serviette hygiénique', '10 pièces', 'Coton, matières absorbantes', 'Matières absorbantes.', 'Serviettes hygiéniques de jour Tiens. Paquet de 10 pièces.'),
('T', 'TIE-022', 'NIGHT USE', 'Tiens Night Use', 4000, 'Serviette hygiénique', '8 pièces', 'Coton, matières absorbantes', 'Matières absorbantes.', 'Serviettes hygiéniques de nuit Tiens, protection longue durée. Paquet de 8 pièces.'),
('T', 'TIE-023', 'PANTY LINER', 'Tiens Panty Liner', 4000, 'Protège-slip', '30 pièces', 'Coton, matières absorbantes', 'Matières absorbantes.', 'Protège-slips Tiens pour une protection discrète au quotidien. Paquet de 30 pièces.'),
('D', 'DYN-001', 'Dynace Rocenta', NULL, 36000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Produit de la gamme Dynace Global (Rocenta). Se référer à l''emballage pour la composition et le mode d''emploi. Tarif client : 36 000 FCFA.'),
('D', 'DYN-002', 'Dynace Lyftmax', 'Dynace lyftmax', 36000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Produit de la gamme Dynace Global (Lyftmax). Se référer à l''emballage pour la composition et le mode d''emploi. Tarif client : 36 000 FCFA.'),
('D', 'DYN-003', 'Dynace Triple Root Coffee', 'dynace Triple Root coffee', 25000, 'Café', 'Selon notice', 'Café, extraits de racines', 'Café, extraits de racines.', 'Café Dynace Triple Root, mélange de café et d''extraits de racines. À consommer chaud.'),
('D', 'DYN-004', 'Dynace Ace Brew Coffee', 'dynace Ace Brew coffee', 25000, 'Café', 'Selon notice', 'Café, extraits de plantes', 'Café, extraits de plantes.', 'Café Dynace Ace Brew, café fonctionnel de la gamme Dynace Global. À consommer chaud.'),
('D', 'DYN-005', 'Dynace Collagene', 'Dynace Collagen', 36000, 'Poudre', 'Selon notice', 'Collagène', 'Collagène.', 'Complément alimentaire Dynace Collagène. Soutient l''élasticité de la peau et la santé des articulations.'),
('D', 'DYN-006', 'Dynace AceGuard', 'dynace AceGuard', 36000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Produit de la gamme Dynace Global (AceGuard). Se référer à l''emballage pour la composition et le mode d''emploi. Tarif client : 36 000 FCFA.'),
('D', 'DYN-007', 'Dynace Sticks / Sachets', NULL, 15000, 'Sachet', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Sticks / sachets de la gamme Dynace Global. Se référer à l''emballage pour la composition et le mode d''emploi.'),
('D', 'DYN-008', 'Dynace Detox', NULL, 36000, 'Complément alimentaire', 'Selon notice', 'Extraits de plantes', 'Extraits de plantes détoxifiantes.', 'Complément alimentaire Dynace Detox pour soutenir l''élimination naturelle des toxines de l''organisme.'),
('D', 'DYN-009', 'Dynace Urbanism (Sunz + Moonz)', 'dynace urbanism ( sunz + Moonz )', 36000, 'Pack', 'Pack jour/nuit', 'Sunz (jour) et Moonz (nuit)', 'Sunz (jour) et Moonz (nuit).', 'Dynace Urbanism : duo Sunz (jour) + Moonz (nuit) de la gamme Dynace Global.'),
('P', 'PHY-001', 'CRYSTAL CELL', NULL, 35000, 'Complément alimentaire', 'Selon notice', 'Cellules souches végétales', 'Cellules souches végétales.', 'Complément alimentaire PhytoScience Crystal Cell, à base de cellules souches végétales. Prix unitaire ; tarif de 70 000 FCFA pour 2 produits.'),
('P', 'PHY-002', 'DOUBLE STEMCELL', NULL, 35000, 'Complément alimentaire', 'Selon notice', 'Cellules souches de pomme et de raisin', 'Cellules souches de pomme (Uttwiler Spätlauber) et de raisin (Vitis vinifera).', 'Complément alimentaire PhytoScience Double Stemcell, à base de cellules souches végétales de pomme et de raisin. Prix unitaire ; tarif de 70 000 FCFA pour 2 produits.'),
('P', 'PHY-003', 'SNOWPHYLLFORTE', 'Snowphyll Forte', 35000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Complément alimentaire PhytoScience Snowphyll Forte. Prix unitaire ; tarif de 70 000 FCFA pour 2 produits.'),
('P', 'PHY-004', 'ACTUAL +', 'Actual+', 55000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Complément alimentaire PhytoScience Actual +. Prix unitaire ; tarif de 90 000 FCFA pour 2 produits.'),
('P', 'PHY-005', 'NUFORTE & NULITE', 'Nuforte et Nulite', 70000, 'Pack', 'Pack', 'Nuforte et Nulite', 'Voir la composition de Nuforte et Nulite.', 'Pack PhytoScience associant Nuforte et Nulite. Prix unitaire ; tarif de 140 000 FCFA pour 2 produits.'),
('P', 'PHY-006', 'NUFORTE', NULL, 40000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Complément alimentaire PhytoScience Nuforte. Prix unitaire ; tarif de 78 000 FCFA pour 2 produits.'),
('P', 'PHY-007', 'NULITE', NULL, 40000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Complément alimentaire PhytoScience Nulite. Prix unitaire ; tarif de 78 000 FCFA pour 2 produits.'),
('P', 'PHY-008', 'MIRACLE INTENSE', NULL, 60000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Complément alimentaire PhytoScience Miracle Intense. Prix unitaire ; tarif de 90 000 FCFA pour 2 produits.'),
('P', 'PHY-009', 'IQPLUS', 'IQ Plus', 63000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Complément alimentaire PhytoScience IQ Plus. Prix unitaire ; tarif de 100 000 FCFA pour 2 produits.'),
('P', 'PHY-010', 'TRIPLE STEMCELL H2O', 'Triple Stemcell H2O', 55000, 'Complément alimentaire', 'Selon notice', 'Cellules souches végétales', 'Cellules souches végétales, eau.', 'Complément alimentaire PhytoScience Triple Stemcell H2O. Prix unitaire ; tarif de 90 000 FCFA pour 2 produits.'),
('S', 'DAS-001', 'DAS STEM CELL', NULL, 210000, 'Complément alimentaire', 'Selon notice', 'Cellules souches végétales', 'Voir la composition indiquée sur l''emballage.', 'Produit DAS Group International, catégorie « Régénération cellulaire ». Soutient le renouvellement cellulaire.'),
('S', 'DAS-002', 'PROPOLIS', 'Propolis DAS', 4500, 'Complément alimentaire', 'Selon notice', 'Propolis', 'Propolis.', 'Propolis DAS Group, catégorie « Immunité / Naturel ». Soutient les défenses naturelles de l''organisme.'),
('S', 'DAS-003', 'CALCI - D', 'Calci-D', 55000, 'Complément alimentaire', 'Selon notice', 'Calcium, vitamine D', 'Calcium, vitamine D.', 'Calci-D de DAS Group, catégorie « Os & Vitamine D ». Contribue à la santé osseuse.'),
('S', 'DAS-004', 'DAS INFECT', NULL, 39500, 'Complément alimentaire', 'Selon notice', 'Extraits de plantes', 'Extraits de plantes.', 'Produit DAS Group, catégorie « Anti-infectieux » selon la grille tarifaire. Complément alimentaire ; ne remplace pas un traitement médical.'),
('S', 'DAS-005', 'TLT MASSO', NULL, 245000, 'Appareil / soin', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Produit DAS Group, spécialité premium (TLT Masso). Se référer à la fiche produit DAS Group pour les détails.'),
('S', 'DAS-006', 'DAS NONI', NULL, 108000, 'Complément alimentaire', 'Selon notice', 'Noni (Morinda citrifolia)', 'Jus ou extrait de Noni (Morinda citrifolia).', 'DAS Noni, produit antioxydant de DAS Group, pour le bien-être général.'),
('S', 'DAS-007', 'POWERMAN', NULL, 39500, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Powerman de DAS Group. La grille tarifaire le classe « Maternité / Femme » (catégorie à confirmer, le nom suggérant un produit pour homme).'),
('S', 'DAS-008', 'Thé REGULATEUR', 'Thé Régulateur', 16000, 'Infusion', 'Selon notice', 'Extraits de plantes', 'Extraits de plantes pour infusion.', 'Thé Régulateur de DAS Group, infusion de plantes pour la régulation et le confort digestif.'),
('S', 'DAS-009', 'DAS DETOX', NULL, 10000, 'Complément alimentaire', 'Selon notice', 'Extraits de plantes détoxifiantes', 'Extraits de plantes.', 'DAS Detox, produit de détoxification de DAS Group.'),
('S', 'DAS-010', 'PACK LITE', NULL, 210000, 'Pack', 'Pack', 'Voir composition du pack', 'Voir composition du pack.', 'Pack Lite DAS Group, entrée de gamme. La composition détaillée n''est pas précisée dans la grille tarifaire.'),
('S', 'DAS-011', 'PACK BOOST', NULL, 945000, 'Pack', 'Pack', 'Voir composition du pack', 'Voir composition du pack.', 'Pack Boost DAS Group, « Énergie & Performance ». La composition détaillée n''est pas précisée dans la grille tarifaire.'),
('S', 'DAS-012', 'PACK BOOST MIX', NULL, 950000, 'Pack', 'Pack', 'Voir composition du pack', 'Voir composition du pack.', 'Pack Boost Mix DAS Group, Boost + Mix complémentaire. La composition détaillée n''est pas précisée dans la grille tarifaire.'),
('S', 'DAS-013', 'PACK CURATIF', NULL, 1280000, 'Pack', 'Pack', 'Voir composition du pack', 'Voir composition du pack.', 'Pack Curatif DAS Group, approche curative. La composition détaillée n''est pas précisée dans la grille tarifaire.'),
('S', 'DAS-014', 'PACK OPTIMUM', NULL, 1743000, 'Pack', 'Pack', 'Voir composition du pack', 'Voir composition du pack.', 'Pack Optimum DAS Group, formule complète premium. La composition détaillée n''est pas précisée dans la grille tarifaire.'),
('S', 'DAS-015', 'PACK OPTIMUM MIX', NULL, 1882500, 'Pack', 'Pack', 'Voir composition du pack', 'Voir composition du pack.', 'Pack Optimum Mix DAS Group, formule complète mixte. La composition détaillée n''est pas précisée dans la grille tarifaire.'),
('S', 'DAS-016', 'PACK OPTIMUM MIX 2', NULL, 1882500, 'Pack', 'Pack', 'Voir composition du pack', 'Voir composition du pack.', 'Pack Optimum Mix 2 DAS Group, formule complète mixte. La composition détaillée n''est pas précisée dans la grille tarifaire.'),
('Y', 'YUP-001', 'Alka Plus', 'Alkaplus', 19500, 'Complément alimentaire', 'Selon notice', 'Minéraux alcalinisants, extraits de plantes', 'Voir la composition indiquée sur l''emballage.', 'Alka Plus de Yupi Global, complément alimentaire pour soutenir l''équilibre acido-basique de l''organisme.'),
('Y', 'YUP-002', 'Detox (60)', 'Yupi Detox 60', 19500, 'Gélule', '60 gélules', 'Extraits de plantes détoxifiantes', 'Extraits de plantes.', 'Detox de Yupi Global, complément alimentaire détoxifiant. Boîte de 60 gélules.'),
('Y', 'YUP-003', 'Immuno (60)', 'Yupi Immuno 60', 19500, 'Gélule', '60 gélules', 'Extraits de plantes immunostimulantes', 'Extraits de plantes.', 'Immuno de Yupi Global, complément alimentaire pour soutenir le système immunitaire. Boîte de 60 gélules.'),
('Y', 'YUP-004', 'Pain and Cold Balm', NULL, 2600, 'Baume', 'Selon notice', 'Extraits de plantes, menthol', 'Menthol, huiles essentielles.', 'Baume Yupi Global Pain and Cold, à application locale pour le confort musculaire et la sensation de fraîcheur. Usage externe.'),
('Y', 'YUP-005', 'Golden Pain Oil', NULL, 9100, 'Huile de massage', 'Selon notice', 'Huiles essentielles', 'Huiles essentielles, huiles végétales.', 'Huile de massage Yupi Global Golden Pain Oil pour le confort musculaire et articulaire. Usage externe.'),
('Y', 'YUP-006', 'Costi Away', NULL, 13650, 'Complément alimentaire', 'Selon notice', 'Extraits de plantes pour le transit', 'Extraits de plantes.', 'Costi Away de Yupi Global, complément alimentaire pour le confort du transit intestinal.'),
('Y', 'YUP-007', 'Women Care', NULL, 16250, 'Complément alimentaire', 'Selon notice', 'Extraits de plantes pour le bien-être féminin', 'Extraits de plantes.', 'Women Care de Yupi Global, complément alimentaire pour le bien-être féminin.'),
('Y', 'YUP-008', 'Men Power Oil', NULL, 6500, 'Huile de massage', 'Selon notice', 'Huiles essentielles', 'Huiles essentielles, huiles végétales.', 'Huile Men Power de Yupi Global pour la vitalité masculine. Usage externe.'),
('Y', 'YUP-009', 'Sea Buckthorn Juice', NULL, 19500, 'Boisson', 'Selon notice', 'Argousier (Hippophae rhamnoides)', 'Jus d''argousier.', 'Jus d''argousier Yupi Global, riche en vitamines et antioxydants.'),
('Y', 'YUP-010', 'Diabo Care', NULL, 16250, 'Complément alimentaire', 'Selon notice', 'Extraits de plantes', 'Extraits de plantes.', 'Diabo Care de Yupi Global, complément alimentaire pour soutenir l''équilibre de la glycémie dans le cadre d''une alimentation saine.'),
('Y', 'YUP-011', 'Diabo Care Spray', NULL, 9100, 'Spray', 'Selon notice', 'Extraits de plantes', 'Extraits de plantes.', 'Diabo Care Spray de Yupi Global, complément en spray pour accompagner l''équilibre de la glycémie.'),
('Y', 'YUP-012', 'Detox (30) GÉLULES', 'Detox (30) gélules', 9750, 'Gélule', '30 gélules', 'Extraits de plantes détoxifiantes', 'Extraits de plantes.', 'Detox de Yupi Global, format de 30 gélules, complément alimentaire détoxifiant.'),
('Y', 'YUP-013', 'Pilon Care', NULL, 16250, 'Complément alimentaire', 'Selon notice', 'Extraits de plantes', 'Extraits de plantes.', 'Pilon Care de Yupi Global, complément alimentaire pour le confort veineux et hémorroïdaire.'),
('Y', 'YUP-014', 'Men Power Malt', NULL, 19500, 'Complément alimentaire', 'Selon notice', 'Malt, extraits de plantes', 'Malt, extraits de plantes.', 'Men Power Malt de Yupi Global, complément alimentaire pour la vitalité masculine.'),
('Y', 'YUP-015', 'Immuno Boost (30) GÉLULES', 'Immuno Boost (30) gélules', 9750, 'Gélule', '30 gélules', 'Extraits de plantes immunostimulantes', 'Extraits de plantes.', 'Immuno Boost de Yupi Global, format de 30 gélules, complément alimentaire pour soutenir l''immunité.'),
('Y', 'YUP-016', 'Dental Drop', NULL, 2600, 'Gouttes', 'Selon notice', 'Huiles essentielles', 'Huiles essentielles.', 'Dental Drop de Yupi Global, gouttes pour l''hygiène et le confort bucco-dentaire.'),
('Y', 'YUP-017', 'YUPI Drink (Café)', 'Yupi Drink Café', 13000, 'Boisson', 'Selon notice', 'Café, extraits de plantes', 'Café, extraits de plantes.', 'YUPI Drink de Yupi Global, boisson au café enrichie en extraits de plantes.'),
('L', 'LGR-001', 'Savon / Soap', 'Longrich Savon', 7500, 'Savon', 'Selon notice', 'Agents lavants doux', 'Agents lavants doux.', 'Savon de toilette Longrich pour le nettoyage quotidien du corps.'),
('L', 'LGR-002', 'Dentifrice thé blanc 200g', 'Dentrifice white tea 200g', 4500, 'Dentifrice', '200 g', 'Extrait de thé blanc', 'Extrait de thé blanc, agents nettoyants.', 'Dentifrice Longrich au thé blanc, tube de 200 g, pour l''hygiène bucco-dentaire.'),
('L', 'LGR-003', 'Dentifrice thé blanc 100g', 'Dentrifice white tea 100g', 2500, 'Dentifrice', '100 g', 'Extrait de thé blanc', 'Extrait de thé blanc, agents nettoyants.', 'Dentifrice Longrich au thé blanc, tube de 100 g, pour l''hygiène bucco-dentaire.'),
('L', 'LGR-004', 'Lait SOD', 'Milk SOD', 6250, 'Lait corporel', 'Selon notice', 'SOD (superoxyde dismutase)', 'Agents hydratants, SOD.', 'Lait corporel Longrich SOD pour hydrater et protéger la peau.'),
('L', 'LGR-005', 'Crème des mains', 'Hand cream', 4500, 'Crème', 'Selon notice', 'Agents hydratants', 'Agents hydratants.', 'Crème pour les mains Longrich, hydrate et adoucit.'),
('L', 'LGR-006', 'Anti moustique', 'Anti-mosquito', 4500, 'Répulsif', 'Selon notice', 'Extraits de plantes répulsifs', 'Extraits de plantes.', 'Produit anti-moustiques Longrich pour se protéger des piqûres.'),
('L', 'LGR-007', 'Gel de douche enfant', 'Children''s shower gel', 7550, 'Gel douche', 'Selon notice', 'Agents lavants doux', 'Agents lavants doux.', 'Gel douche Longrich pour enfants, doux pour la peau fragile.'),
('L', 'LGR-008', 'Gel de douche', 'Shower gel', 8350, 'Gel douche', 'Selon notice', 'Agents lavants doux', 'Agents lavants doux.', 'Gel douche Longrich pour le nettoyage quotidien du corps.'),
('L', 'LGR-009', 'Crème bébé', 'Baby cream', 3500, 'Crème', 'Selon notice', 'Agents hydratants', 'Agents hydratants.', 'Crème Longrich pour bébé, hydrate et protège la peau délicate.'),
('L', 'LGR-010', 'Poudre de noisette enfant', 'Hazelnut powder child', 7550, 'Poudre alimentaire', 'Selon notice', 'Noisette', 'Poudre de noisette.', 'Poudre de noisette Longrich pour enfants.'),
('L', 'LGR-011', 'Parfum de bouche', 'mouthfeel', 3750, 'Spray buccal', 'Selon notice', 'Extraits de plantes rafraîchissants', 'Extraits de plantes, menthe.', 'Spray buccal Longrich pour une haleine fraîche.'),
('L', 'LGR-012', 'Shampooing blanc', 'white shampoo', 4000, 'Shampooing', 'Selon notice', 'Agents lavants doux', 'Agents lavants doux.', 'Shampooing blanc Longrich pour le lavage des cheveux.'),
('L', 'LGR-013', 'Shampooing 2en1', '2 in 1 shampoo', 7800, 'Shampooing', 'Selon notice', 'Agents lavants et démêlants', 'Agents lavants et démêlants.', 'Shampooing 2 en 1 Longrich, nettoie et démêle les cheveux.'),
('L', 'LGR-014', 'Anti transpirant', 'Antiperspirant', 4125, 'Déodorant', 'Selon notice', 'Agents antitranspirants', 'Agents antitranspirants.', 'Antitranspirant Longrich pour une fraîcheur durable.'),
('L', 'LGR-015', 'Protège slip', 'Underwear protector', 62000, 'Protège-slip', 'Selon notice', 'Matières absorbantes', 'Matières absorbantes.', 'Protège-slips Longrich. Prix relevé de la grille : 62 000 FCFA (à confirmer).'),
('L', 'LGR-016', 'Serviette mixte', 'Mixed towel', 62000, 'Serviette hygiénique', 'Selon notice', 'Matières absorbantes', 'Matières absorbantes.', 'Serviettes hygiéniques mixtes Longrich. Prix relevé de la grille : 62 000 FCFA (à confirmer).'),
('L', 'LGR-017', 'Serviette nuit', 'Night towel', 62000, 'Serviette hygiénique', 'Selon notice', 'Matières absorbantes', 'Matières absorbantes.', 'Serviettes hygiéniques de nuit Longrich. Prix relevé de la grille : 62 000 FCFA (à confirmer).'),
('L', 'LGR-018', 'Masque facial', 'Face mask', 11750, 'Masque', 'Selon notice', 'Agents hydratants', 'Agents hydratants, extraits de plantes.', 'Masque facial Longrich pour hydrater et raviver la peau du visage.'),
('L', 'LGR-019', 'Couche bébé', 'Baby diaper', 10000, 'Couche', 'Selon notice', 'Matières absorbantes', 'Matières absorbantes.', 'Couches pour bébé Longrich.'),
('L', 'LGR-020', 'Cordyceps', NULL, 90000, 'Complément alimentaire', 'Selon notice', 'Cordyceps', 'Cordyceps.', 'Cordyceps Longrich. Soutient l''énergie et la vitalité.'),
('L', 'LGR-021', 'Calcium', NULL, 13500, 'Complément alimentaire', 'Selon notice', 'Calcium', 'Calcium.', 'Calcium Longrich. Contribue au maintien d''une ossature et d''une dentition normales.'),
('L', 'LGR-022', 'Arthro', NULL, 25000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Arthro Longrich, complément alimentaire pour le confort articulaire.'),
('L', 'LGR-023', 'Rejuvenating body lotion', 'Rejuvenating Body Lotion', 4500, 'Lotion', 'Selon notice', 'Agents hydratants', 'Agents hydratants.', 'Lotion corporelle rajeunissante Longrich pour hydrater et adoucir la peau.'),
('L', 'LGR-024', 'Café de 10', 'Coffee of 10', 6000, 'Café', '10 sachets', 'Café, extraits de plantes', 'Café, extraits de plantes.', 'Café Longrich, boîte de 10 sachets.'),
('L', 'LGR-025', 'Café de 20', 'Coffee of 20', 12000, 'Café', '20 sachets', 'Café, extraits de plantes', 'Café, extraits de plantes.', 'Café Longrich, boîte de 20 sachets.'),
('L', 'LGR-026', 'Thé rose', 'Pink tea', 7500, 'Infusion', 'Selon notice', 'Extraits de plantes', 'Extraits de plantes.', 'Thé rose Longrich. La grille tarifaire anglaise porte un libellé erroné (Coffee of 20) ; le produit est identifié comme thé rose.'),
('L', 'LGR-027', 'Thé marron', 'Brown tea', 7500, 'Infusion', 'Selon notice', 'Extraits de plantes', 'Extraits de plantes.', 'Thé marron Longrich, infusion de plantes.'),
('L', 'LGR-028', 'Thé vert', 'Green tea', 7500, 'Infusion', 'Selon notice', 'Thé vert', 'Feuilles de thé vert.', 'Thé vert Longrich, riche en antioxydants.'),
('L', 'LGR-029', 'Vin de santé', 'Health wine', 15000, 'Boisson', 'Selon notice', 'Extraits de plantes', 'Extraits de plantes, vin.', 'Vin de santé Longrich.'),
('L', 'LGR-030', 'Berry oil', NULL, 35000, 'Complément alimentaire', 'Selon notice', 'Huile de baies', 'Huile de baies.', 'Berry oil Longrich. La grille tarifaire anglaise porte le libellé « Health wine » (erreur probable).'),
('L', 'LGR-031', 'Libao', NULL, 30000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Libao Longrich, complément alimentaire de bien-être.'),
('L', 'LGR-032', 'Mengqian', NULL, 30000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Mengqian Longrich, complément alimentaire de bien-être.'),
('L', 'LGR-033', 'Nutriv Rich bleu et rose', 'Nutriv Rich blue and pink', 112000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Nutriv Rich Longrich (bleu et rose), complément alimentaire nutritionnel.'),
('L', 'LGR-034', 'Pot(180)', 'Pot 180', 240000, 'Accessoire', 'Selon notice', 'Non applicable', 'Non applicable.', 'Pot (180) Longrich. Produit non alimentaire.'),
('L', 'LGR-035', 'Pot(170)', 'Pot 170', 232000, 'Accessoire', 'Selon notice', 'Non applicable', 'Non applicable.', 'Pot (170) Longrich. Produit non alimentaire.'),
('L', 'LGR-036', 'Gobelet', 'Cup', 60000, 'Accessoire', 'Selon notice', 'Non applicable', 'Non applicable.', 'Gobelet Longrich. Produit non alimentaire.'),
('L', 'LGR-037', 'Chaussure homme', 'Men''s shoes', 450000, 'Accessoire', 'Selon notice', 'Non applicable', 'Non applicable.', 'Chaussures pour homme Longrich. Produit non alimentaire.'),
('L', 'LGR-038', 'Chaussure femme', 'Women''s shoes', 525000, 'Accessoire', 'Selon notice', 'Non applicable', 'Non applicable.', 'Chaussures pour femme Longrich. Produit non alimentaire.'),
('L', 'LGR-039', 'Collier homme et femme', 'Necklace for men and women', 250000, 'Accessoire', 'Selon notice', 'Non applicable', 'Non applicable.', 'Collier Longrich pour homme et femme. Produit non alimentaire.'),
('L', 'LGR-040', 'Cordyceps noir', 'Black Cordyceps', 90000, 'Complément alimentaire', 'Selon notice', 'Cordyceps noir', 'Cordyceps noir.', 'Cordyceps noir Longrich. Soutient l''énergie et la vitalité.'),
('L', 'LGR-041', 'Serviette bleu 1pc', 'Blue towel 1pc', 3500, 'Serviette', '1 pièce', 'Non applicable', 'Non applicable.', 'Serviette bleue Longrich, 1 pièce.'),
('L', 'LGR-042', 'Sanitizer', 'Longrich Sanitizer', 2500, 'Gel hydroalcoolique', 'Selon notice', 'Alcool', 'Alcool.', 'Gel désinfectant Longrich pour les mains.'),
('L', 'LGR-043', 'Evergreen', NULL, 150000, 'Complément alimentaire', 'Selon notice', 'Selon notice', 'Voir la composition indiquée sur l''emballage.', 'Evergreen Longrich, complément alimentaire de bien-être.'),
('L', 'LGR-044', 'Thé tremella', 'Tremella tea', 21250, 'Infusion', 'Selon notice', 'Tremella (Tremella fuciformis)', 'Extrait de Tremella.', 'Thé Tremella Longrich, infusion de champignon Tremella.'),
('L', 'LGR-045', 'Vitamine C', 'Vitamin C', 12500, 'Complément alimentaire', 'Selon notice', 'Vitamine C', 'Vitamine C (acide ascorbique).', 'Vitamine C Longrich. Soutient les défenses immunitaires.'),
('L', 'LGR-046', 'Chaussure tennis', 'Tennis shoes', 125500, 'Accessoire', 'Selon notice', 'Non applicable', 'Non applicable.', 'Chaussures de tennis Longrich. Produit non alimentaire.'),
('L', 'LGR-047', 'Hyaluronic Skin repair', 'Hyaluronic Skin Repair', 8250, 'Soin visage', 'Selon notice', 'Acide hyaluronique', 'Acide hyaluronique, agents hydratants.', 'Soin Longrich à l''acide hyaluronique pour réparer et hydrater la peau.'),
('L', 'LGR-048', 'Savon 700g', 'Soap 700g', 10875, 'Savon', '700 g', 'Agents lavants', 'Agents lavants.', 'Savon Longrich de 700 g.'),
('L', 'LGR-049', 'Parfum femme', 'Women''s perfume', 21250, 'Parfum', 'Selon notice', 'Parfum', 'Alcool, parfum.', 'Parfum pour femme Longrich.'),
('L', 'LGR-050', 'Parfum homme', 'Men''s perfume', 21250, 'Parfum', 'Selon notice', 'Parfum', 'Alcool, parfum.', 'Parfum pour homme Longrich.'),
('L', 'LGR-051', 'Gingembre noir', 'Black ginger', 87500, 'Complément alimentaire', 'Selon notice', 'Gingembre noir (Kaempferia parviflora)', 'Extrait de gingembre noir.', 'Gingembre noir Longrich, complément alimentaire pour la vitalité.'),
('L', 'LGR-052', 'Power bank', NULL, 25000, 'Accessoire', 'Selon notice', 'Non applicable', 'Non applicable.', 'Batterie externe Longrich. La grille anglaise porte le libellé « Black ginger » (erreur probable).'),
('L', 'LGR-053', 'Energy drink', NULL, 1725, 'Boisson énergisante', 'Selon notice', 'Caféine, vitamines', 'Eau, caféine, vitamines.', 'Boisson énergisante Longrich.'),
('L', 'LGR-054', 'Detergent', 'Détergent', 7500, 'Détergent', 'Selon notice', 'Agents lavants', 'Agents lavants.', 'Détergent Longrich pour le linge.'),
('L', 'LGR-055', 'Huile de serpent 80ml', 'Snake oil 80ml', 4250, 'Huile', '80 ml', 'Huile de serpent', 'Huile de serpent.', 'Huile de serpent Longrich, flacon de 80 ml. Usage externe.'),
('L', 'LGR-056', 'Huile de bain aux olives', 'Bath oil with olives', 11250, 'Huile de bain', 'Selon notice', 'Huile d''olive', 'Huile d''olive.', 'Huile de bain Longrich aux olives.'),
('L', 'LGR-057', 'Dentifrice Artemisia 200g', 'Dentifrice art 200g', 4000, 'Dentifrice', '200 g', 'Artemisia', 'Extrait d''Artemisia, agents nettoyants.', 'Dentifrice Longrich gamme Artemisia, tube de 200 g.'),
('L', 'LGR-058', 'Dentifrice Artemisia 120g', 'Dentifrice art 120g', 2500, 'Dentifrice', '120 g', 'Artemisia', 'Extrait d''Artemisia, agents nettoyants.', 'Dentifrice Longrich gamme Artemisia, tube de 120 g.'),
('L', 'LGR-059', 'Art savon', 'Soap art', 2500, 'Savon', 'Selon notice', 'Artemisia', 'Extrait d''Artemisia, agents lavants.', 'Savon Longrich gamme Artemisia.'),
('L', 'LGR-060', 'Art savon sous vêtement', 'Art soap underwear', 3000, 'Savon', 'Selon notice', 'Artemisia', 'Extrait d''Artemisia, agents lavants.', 'Savon pour sous-vêtements Longrich gamme Artemisia.'),
('L', 'LGR-061', 'Bain de bouche art', 'Shower bath art', 6000, 'Bain de bouche', 'Selon notice', 'Artemisia', 'Extrait d''Artemisia.', 'Bain de bouche Longrich gamme Artemisia pour l''hygiène bucco-dentaire.'),
('L', 'LGR-062', 'Art shampooing', 'Shampoo Art', 6500, 'Shampooing', 'Selon notice', 'Artemisia', 'Extrait d''Artemisia, agents lavants.', 'Shampooing Longrich gamme Artemisia.'),
('L', 'LGR-063', 'Art conditioner', 'Conditioner Art', 6500, 'Après-shampooing', 'Selon notice', 'Artemisia', 'Extrait d''Artemisia.', 'Après-shampooing Longrich gamme Artemisia.'),
('L', 'LGR-064', 'Art gel de douche', 'Shower gel Art', 7000, 'Gel douche', 'Selon notice', 'Artemisia', 'Extrait d''Artemisia, agents lavants.', 'Gel douche Longrich gamme Artemisia.'),
('L', 'LGR-065', 'Art hand wash', NULL, 2500, 'Lave-mains', 'Selon notice', 'Artemisia', 'Extrait d''Artemisia, agents lavants.', 'Lave-mains Longrich gamme Artemisia.'),
('L', 'LGR-066', 'Art detergent', 'Art détergent', 11000, 'Détergent', 'Selon notice', 'Artemisia', 'Extrait d''Artemisia, agents lavants.', 'Détergent Longrich gamme Artemisia.'),
('L', 'LGR-067', 'Travel pack', NULL, 1000, 'Kit', 'Selon notice', 'Non applicable', 'Non applicable.', 'Kit de voyage Longrich.'),
('L', 'LGR-068', 'Ph', NULL, 1000, 'Accessoire', 'Selon notice', 'Non applicable', 'Non applicable.', 'Article « Ph » Longrich (papier test pH probable).'),
('L', 'LGR-069', 'Demo kit', NULL, 26250, 'Kit', 'Selon notice', 'Non applicable', 'Non applicable.', 'Kit de démonstration Longrich.');

UPDATE partner_grid g SET company_id = pc.company_id FROM partner_companies pc WHERE pc.code = g.code;

-- Every existing product matching a grid entry (rn = 1 is the one we keep)
CREATE TEMPORARY TABLE partner_matches ON COMMIT DROP AS
SELECT g.sku AS grid_sku, p.id AS product_id,
       ROW_NUMBER() OVER (PARTITION BY g.sku ORDER BY (p.sku = g.sku) DESC, p.id) AS rn
FROM partner_grid g
JOIN products p ON p.company_id = g.company_id
 AND (p.sku = g.sku
      OR pg_temp.nk(p.name) = pg_temp.nk(g.name)
      OR (g.alt_name IS NOT NULL AND pg_temp.nk(p.name) = pg_temp.nk(g.alt_name)));

-- A product matching several grid entries is only kept by the first one
DELETE FROM partner_matches m
USING partner_matches o
WHERE m.product_id = o.product_id AND m.grid_sku > o.grid_sku;

UPDATE partner_grid g SET product_id = m.product_id
FROM partner_matches m WHERE m.grid_sku = g.sku AND m.rn = 1;

-- Normalise the kept products
UPDATE products p
SET name = g.name,
    price = g.price,
    description = g.description,
    dosage = COALESCE(g.dosage, p.dosage),
    form = COALESCE(g.form, p.form),
    active_ingredient = COALESCE(g.active_ingredient, p.active_ingredient),
    ingredients = COALESCE(g.ingredients, p.ingredients),
    brand = pc.brand,
    active = TRUE,
    updated_at = CURRENT_TIMESTAMP
FROM partner_grid g
JOIN partner_companies pc ON pc.code = g.code
WHERE p.id = g.product_id;

-- Duplicates of the same product: delete when unreferenced, otherwise deactivate
UPDATE products p SET active = FALSE, updated_at = CURRENT_TIMESTAMP
FROM partner_matches m
WHERE p.id = m.product_id AND m.rn > 1
  AND EXISTS (SELECT 1 FROM cart_items x WHERE x.product_id = p.id
              UNION ALL SELECT 1 FROM order_items x WHERE x.product_id = p.id
              UNION ALL SELECT 1 FROM bundle_items x WHERE x.product_id = p.id);

DELETE FROM products p
USING partner_matches m
WHERE p.id = m.product_id AND m.rn > 1
  AND NOT EXISTS (SELECT 1 FROM cart_items x WHERE x.product_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM order_items x WHERE x.product_id = p.id)
  AND NOT EXISTS (SELECT 1 FROM bundle_items x WHERE x.product_id = p.id);

-- Insert the missing products
INSERT INTO products (company_id, name, sku, description, brand, active_ingredient, dosage, form,
                      price, ingredients, requires_prescription, active)
SELECT g.company_id, g.name, g.sku, g.description, pc.brand, g.active_ingredient, g.dosage, g.form,
       g.price, g.ingredients, FALSE, TRUE
FROM partner_grid g
JOIN partner_companies pc ON pc.code = g.code
WHERE g.product_id IS NULL AND g.company_id IS NOT NULL
ON CONFLICT (sku) DO NOTHING;

UPDATE partner_grid g SET product_id = p.id
FROM products p
WHERE g.product_id IS NULL AND p.sku = g.sku AND p.company_id = g.company_id;

-- Stock 200 for every managed product
INSERT INTO inventory (product_id, quantity, minimum_quantity, updated_at)
SELECT g.product_id, 200, 0, CURRENT_TIMESTAMP
FROM partner_grid g
WHERE g.product_id IS NOT NULL
ON CONFLICT (product_id) DO UPDATE
SET quantity = 200, updated_at = CURRENT_TIMESTAMP;
