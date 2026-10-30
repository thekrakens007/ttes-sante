-- V28: catalog cleanup.
-- 1) Merge duplicate products (the oldest row is kept), repointing orders/carts/bundles/cures.
-- 2) Move Forever packs from products to product_bundles.
-- 3) Set all stock to 200 and auto-reset stock to 200 once it falls to 180 or less.

CREATE TEMP TABLE tmp_dup_map (drop_id BIGINT PRIMARY KEY, keep_id BIGINT NOT NULL) ON COMMIT DROP;

INSERT INTO tmp_dup_map (drop_id, keep_id) VALUES
  -- Dynace
  (462,127),(457,128),(454,129),(458,130),(460,131),(461,132),(459,133),(456,134),
  -- Vestige
  (414,141),(415,143),(416,144),(418,160),(419,161),(420,162),(421,163),(423,173),
  (424,187),(425,188),(426,200),(427,202),(428,203),(429,204),(430,207),(431,208),
  (434,213),(435,217),(436,218),(437,219),
  -- Tiens
  (452,24),(447,27),(444,29),(450,30),(442,34),(445,50),(446,51),(449,52),(448,53),
  (453,82),(451,137),(443,149),(408,228),(441,228),
  -- PhytoScience
  (410,13),(464,15),(466,19),(463,20),(465,21),
  -- Forever
  (439,290),(440,413),
  -- Longrich
  (71,66),(372,66),(522,66),(523,371),
  (72,65),(362,65),(368,65),(527,65),
  (507,403),
  (378,67),(516,67),(379,68),(515,68),(376,70),(517,70),(369,69),(525,69),
  (377,73),(518,73),(373,76),(521,76),(375,78),(519,78),(502,79),
  (520,374),
  (541,348),(540,349),(539,350),(537,353),(538,352),(536,355),(535,356),
  (533,359),(532,360),(531,361),(529,363),(528,367),(524,370),(526,364),
  (514,380),(513,381),(512,398),(511,399),(510,400),(509,401),(508,402),
  (506,404),(505,405);

-- Only process pairs where both rows still exist (idempotent / fresh-database safe).
DELETE FROM tmp_dup_map m
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = m.drop_id)
   OR NOT EXISTS (SELECT 1 FROM products WHERE id = m.keep_id);

-- Prices taken from the official lists.
UPDATE products SET price = 35500 WHERE id = 149;
UPDATE products SET price = 15500 WHERE id = 228;
UPDATE products SET price = 90000 WHERE id = 65;
UPDATE products SET price = 30000 WHERE id IN (67, 68);
UPDATE products SET price = 35000 WHERE id = 70;
UPDATE products SET price = 25000 WHERE id = 69;
UPDATE products SET price = 15000 WHERE id = 73;
UPDATE products SET price = 7500  WHERE id IN (76, 78);
UPDATE products SET price = 12500 WHERE id = 79;

-- Repoint references.
UPDATE order_items oi SET product_id = m.keep_id FROM tmp_dup_map m WHERE oi.product_id = m.drop_id;
UPDATE cart_items ci SET product_id = m.keep_id FROM tmp_dup_map m WHERE ci.product_id = m.drop_id;
UPDATE cure_items cu SET product_id = m.keep_id FROM tmp_dup_map m WHERE cu.product_id = m.drop_id;

-- bundle_items has UNIQUE (bundle_id, product_id): merge quantities when the kept product is already present.
UPDATE bundle_items k SET quantity = k.quantity + d.quantity
FROM bundle_items d JOIN tmp_dup_map m ON d.product_id = m.drop_id
WHERE k.bundle_id = d.bundle_id AND k.product_id = m.keep_id;
DELETE FROM bundle_items d USING tmp_dup_map m
WHERE d.product_id = m.drop_id
  AND EXISTS (SELECT 1 FROM bundle_items k WHERE k.bundle_id = d.bundle_id AND k.product_id = m.keep_id);
UPDATE bundle_items bi SET product_id = m.keep_id FROM tmp_dup_map m WHERE bi.product_id = m.drop_id;

-- Keep the best image: give the kept product the dropped duplicate's image when it has none.
INSERT INTO product_images (product_id, image_url, is_main, display_order, created_at)
SELECT DISTINCT ON (m.keep_id) m.keep_id, i.image_url, TRUE, 0, NOW()
FROM tmp_dup_map m JOIN product_images i ON i.product_id = m.drop_id
WHERE NOT EXISTS (SELECT 1 FROM product_images k WHERE k.product_id = m.keep_id)
ORDER BY m.keep_id, i.is_main DESC, i.display_order;

-- Delete duplicates (inventory, images, categories and therapeutic areas cascade).
DELETE FROM products WHERE id IN (SELECT drop_id FROM tmp_dup_map);

-- Forever packs: products -> product_bundles.
CREATE TEMP TABLE tmp_pack_move (product_id BIGINT PRIMARY KEY, bundle_id BIGINT, bname TEXT) ON COMMIT DROP;

INSERT INTO tmp_pack_move (product_id, bname)
SELECT id, CASE WHEN id IN (479, 481) THEN 'Pack Longrich ' ELSE 'Pack Forever ' END || trim(name) FROM products
WHERE id IN (315, 316, 317, 318, 319, 320, 299, 300, 321, 322, 325, 479, 481);

WITH ins AS (
  INSERT INTO product_bundles (name, description, price, active, created_at, updated_at)
  SELECT t.bname, p.description, p.price, p.active, NOW(), NOW()
  FROM products p JOIN tmp_pack_move t ON t.product_id = p.id
  WHERE NOT EXISTS (SELECT 1 FROM product_bundles b WHERE b.name = t.bname)
  RETURNING id, name
)
SELECT 1 FROM ins;

UPDATE tmp_pack_move t SET bundle_id = b.id
FROM product_bundles b WHERE b.name = t.bname;

UPDATE order_items oi SET bundle_id = t.bundle_id, product_id = NULL
FROM tmp_pack_move t WHERE oi.product_id = t.product_id;
UPDATE cart_items ci SET bundle_id = t.bundle_id, product_id = NULL
FROM tmp_pack_move t WHERE ci.product_id = t.product_id;
INSERT INTO bundle_images (bundle_id, image_url, is_main, display_order, created_at)
SELECT t.bundle_id, i.image_url, i.is_main, i.display_order, NOW()
FROM tmp_pack_move t JOIN product_images i ON i.product_id = t.product_id
WHERE NOT EXISTS (SELECT 1 FROM bundle_images x WHERE x.bundle_id = t.bundle_id);

DELETE FROM cure_items WHERE product_id IN (SELECT product_id FROM tmp_pack_move);
DELETE FROM bundle_items WHERE product_id IN (SELECT product_id FROM tmp_pack_move);
DELETE FROM products WHERE id IN (SELECT product_id FROM tmp_pack_move);


-- Vestige treatment kits (kit #1 Paralysie/AVC already exists as a bundle).
CREATE TEMP TABLE tmp_kits (name TEXT PRIMARY KEY, price NUMERIC(12,2), items TEXT) ON COMMIT DROP;
INSERT INTO tmp_kits (name, price, items) VALUES
  ('Kit Asthme', 21000, '143:1,162:1'),
  ('Kit Thyroïde', 45000, '161:1,162:1,141:1,417:1'),
  ('Kit Diabète 1 & 2', 43000, '200:1,162:1,141:1,160:1'),
  ('Kit Arthrite', 41000, '173:1,162:1,141:1,163:1'),
  ('Kit Yeux', 58000, '162:1,143:1,422:1,196:1'),
  ('Kit Perte de poids', 63000, '175:1,194:1,195:1'),
  ('Kit Anémie', 23500, '143:1,164:1,144:1'),
  ('Kit Faiblesse sexuelle', 72500, '143:1,174:1,144:1,193:1,162:1'),
  ('Kit Tumeur', 62000, '141:1,143:1,162:1,161:1,417:1,144:1'),
  ('Kit Hépatite B / Cirrhose du foie', 73500, '161:1,422:1,174:1,201:1,417:1'),
  ('Kit Foie gras', 55000, '161:1,162:1,201:1,417:1,144:1'),
  ('Kit Ulcère', 41000, '161:1,141:1,417:1,144:1'),
  ('Kit Infertilité féminine', 64500, '161:1,141:1,422:1,143:1,164:1'),
  ('Kit Entretien grossesse', 12500, '164:1,173:1'),
  ('Kit Hernie discale', 42000, '422:1,143:1,162:1'),
  ('Kit Sinusite', 33500, '143:1,160:1,174:1'),
  ('Kit Colopathie', 50500, '433:1,161:1,417:1,160:1,198:1'),
  ('Kit Prostatite', 51500, '161:1,141:1,160:1,199:1'),
  ('Kit Infertilité masculine', 43500, '144:1,174:1,422:1'),
  ('Kit Tension artérielle', 59500, '161:1,141:1,162:1,173:1,174:1'),
  ('Kit Cancer du sein', 55000, '417:1,143:1,162:1,141:1,161:1'),
  ('Kit Insuffisance rénale', 60000, '161:1,174:1,144:1,422:1'),
  ('Kit Goutte / Acide urique', 15000, '160:1,144:1'),
  ('Kit Infection pulmonaire', 41500, '143:1,141:1,422:1'),
  ('Kit Kyste, Fibrome, Myome', 49000, '161:1,162:1,417:1,164:1,160:1'),
  ('Kit Hémorroïde', 35500, '161:1,162:1,160:1'),
  ('Kit Bien-être', 44000, '141:1,162:1,161:1,173:1'),
  ('Kit Perte de mémoire', 28000, '162:1,143:1,144:1'),
  ('Kit Insomnie', 37500, '162:1,143:1,161:1'),
  ('Kit Cervical / Moelle épinière', 34500, '162:1,141:1,173:1,417:1'),
  ('Kit Cancer du sang', 53000, '161:1,141:1,417:1,160:1,162:1'),
  ('Kit Problème bucco-dentaire', 20000, '141:1,173:1,433:1'),
  ('Kit Infection urinaire', 38500, '161:1,160:1,417:1,144:1'),
  ('Kit Frigidité', 27500, '164:1,422:1'),
  ('Kit Toux', 31500, '161:1,160:1,417:1'),
  ('Kit Tuberculose', 38500, '141:1,160:1,164:1,201:1'),
  ('Kit Plaie', 23500, '161:1,417:1'),
  ('Kit Nerf sciatique', 49500, '144:1,422:1,174:1,173:1'),
  ('Kit Hernie ombilicale', 30500, '417:1,144:1,161:1'),
  ('Kit Insuffisance veineuse', 29500, '144:1,174:1,417:1'),
  ('Kit Nerfs', 52500, '143:1,422:1,174:1,173:1'),
  ('Kit Épilepsie', 90500, '144:1,174:2,141:1,422:2'),
  ('Kit Zona', 46500, '432:1,160:1,417:1,161:1,141:1'),
  ('Kit Douleur lombaire', 24000, '173:1,144:1,162:1'),
  ('Kit Hernie étranglée', 38500, '161:1,160:1,417:1,144:1'),
  ('Kit Hernie inguinale', 42000, '141:1,161:1,160:1,417:1'),
  ('Kit Fièvre typhoïde, Paludisme', 47000, '161:1,144:1,160:1,198:1'),
  ('Kit Calcul rénal', 104500, '161:1,422:2,174:2,160:1,144:1'),
  ('Kit Ménopause et Périménopause', 30500, '164:1,173:1,162:1,144:1'),
  ('Kit VIH', 110000, '143:1,422:2,141:1,161:1,174:2');

INSERT INTO product_bundles (name, description, price, active, created_at, updated_at)
SELECT k.name, 'Kit bien-être Vestige : ' || k.name || '. Les kits sont des compléments alimentaires et ne remplacent pas un traitement médical.', k.price, TRUE, NOW(), NOW()
FROM tmp_kits k
WHERE NOT EXISTS (SELECT 1 FROM product_bundles b WHERE b.name = k.name);

INSERT INTO bundle_items (bundle_id, product_id, quantity)
SELECT b.id, split_part(e, ':', 1)::BIGINT, split_part(e, ':', 2)::INT
FROM tmp_kits k
JOIN product_bundles b ON b.name = k.name
CROSS JOIN LATERAL unnest(string_to_array(k.items, ',')) AS e
WHERE EXISTS (SELECT 1 FROM products p WHERE p.id = split_part(e, ':', 1)::BIGINT)
  AND NOT EXISTS (SELECT 1 FROM bundle_items x WHERE x.bundle_id = b.id);

-- Yupi membership packs.
INSERT INTO product_bundles (name, description, price, active, created_at, updated_at)
SELECT v.name, 'Pack d''adhésion Yupi ' || v.name, v.price, TRUE, NOW(), NOW()
FROM (VALUES ('Pack YUPI', 10500), ('Pack ÉLITE', 48000), ('Pack SUCCESS', 78000), ('Pack PRESTIGE', 123000),
             ('Pack VISIONARY', 303000), ('Pack TRIOMPH', 603000), ('Pack PROSPERITY', 1203000)) AS v(name, price)
WHERE NOT EXISTS (SELECT 1 FROM product_bundles b WHERE b.name = v.name);

-- Stock: every product has an inventory row, all at 200.
INSERT INTO inventory (product_id, quantity, minimum_quantity)
SELECT p.id, 200, 0 FROM products p
WHERE NOT EXISTS (SELECT 1 FROM inventory i WHERE i.product_id = p.id);

UPDATE inventory SET quantity = 200 WHERE quantity <> 200;

-- Automatic restock: whenever quantity reaches 180 or less it goes back to 200.
CREATE OR REPLACE FUNCTION inventory_auto_restock() RETURNS trigger AS $$
BEGIN
  IF NEW.quantity <= 180 THEN
    NEW.quantity := 200;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_auto_restock ON inventory;
CREATE TRIGGER trg_inventory_auto_restock
  BEFORE INSERT OR UPDATE OF quantity ON inventory
  FOR EACH ROW EXECUTE FUNCTION inventory_auto_restock();

-- Bundles without an image reuse the main image of their first component product.
INSERT INTO bundle_images (bundle_id, image_url, is_main, display_order, created_at)
SELECT b.id,
       (SELECT pi.image_url FROM bundle_items bi JOIN product_images pi ON pi.product_id = bi.product_id
        WHERE bi.bundle_id = b.id ORDER BY bi.id, pi.is_main DESC, pi.display_order LIMIT 1),
       TRUE, 0, NOW()
FROM product_bundles b
WHERE NOT EXISTS (SELECT 1 FROM bundle_images x WHERE x.bundle_id = b.id)
  AND EXISTS (SELECT 1 FROM bundle_items bi JOIN product_images pi ON pi.product_id = bi.product_id
              WHERE bi.bundle_id = b.id);
