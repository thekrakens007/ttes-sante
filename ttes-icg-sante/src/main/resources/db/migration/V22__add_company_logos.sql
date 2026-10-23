ALTER TABLE companies
    ALTER COLUMN logo_url TYPE TEXT;

UPDATE companies
SET logo_url = CASE LOWER(BTRIM(name))
    WHEN 'tiens cameroun' THEN 'https://www.tiens.com/tiens-favicon.svg'
    WHEN 'vestige cameroun' THEN 'https://www.myvestige.com/images/theme/logo-1.png'
    WHEN 'phytoscience cameroun' THEN 'https://phytoscienceafrica.com/wp-content/uploads/2019/08/logo.png'
    WHEN 'longrich cameroun' THEN 'https://www.longrich.com/img/top_logo.png'
    WHEN 'forever living cameroun' THEN 'https://cdn.foreverliving.com/flpi/logo/foreverliving-eCom-logo.svg'
    WHEN 'dynace global cameroun' THEN 'https://member.dynaceglobal.com/assets/images/login-logo-1.png'
END
WHERE (logo_url IS NULL OR BTRIM(logo_url) = '')
  AND LOWER(BTRIM(name)) IN (
      'tiens cameroun',
      'vestige cameroun',
      'phytoscience cameroun',
      'longrich cameroun',
      'forever living cameroun',
      'dynace global cameroun'
  );
