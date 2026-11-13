-- Datos iniciales de Detalle TM. Se pueden cambiar todos desde el panel admin.
-- Ejecutar una sola vez sobre una base vacía: npm run db:seed:local (o :remote).

INSERT INTO categories (slug, name, color, sort_order) VALUES
  ('decoraciones', 'Decoraciones', '#FBE3EB', 1),
  ('floristeria', 'Floristería', '#FBE9C4', 2),
  ('desayunos', 'Desayunos', '#F2EDF9', 3),
  ('detalles-y-anchetas', 'Detalles y anchetas', '#E3EEF8', 4);

INSERT INTO occasions (slug, name, color, sort_order, featured) VALUES
  ('cumpleanos', 'Cumpleaños', '#F7C5D5', 1, 1),
  ('dia-de-la-madre', 'Día de la madre', '#F9DFA8', 2, 1),
  ('amor-y-amistad', 'Amor y amistad', '#F4A9A3', 3, 1),
  ('baby-shower', 'Baby shower', '#CFE3F5', 4, 1),
  ('matrimonio', 'Matrimonio', '#F2EDF9', 5, 0),
  ('infantil', 'Infantil y temáticas', '#E6DDF3', 6, 1),
  ('para-ella', 'Para ella', '#FBE3EB', 7, 0),
  ('eventos', 'Eventos', '#FBE9C4', 8, 0);

INSERT INTO addons (name, sort_order) VALUES
  ('Globo burbuja personalizado', 1),
  ('Globos metalizados (número o letra)', 2),
  ('Caja de chocolates', 3),
  ('Fresas con chocolate', 4),
  ('Peluche pequeño', 5),
  ('Botella de vino o espumoso', 6),
  ('Mini torta o cupcakes', 7),
  ('Tarjeta con dedicatoria impresa', 8),
  ('Velita con deseo personalizado', 9),
  ('Rosas adicionales (por unidad)', 10);

-- Productos iniciales a partir de las colecciones actuales. Las fotos y descripciones se cargan en el panel.
INSERT INTO products (slug, name, category_id, featured, tags, sort_order) VALUES
  ('arco-en-globos', 'Arco en globos', (SELECT id FROM categories WHERE slug='decoraciones'), 1, '["mas-pedido"]', 1),
  ('decoracion-en-globos', 'Decoración en globos', (SELECT id FROM categories WHERE slug='decoraciones'), 0, '[]', 2),
  ('decoracion-paneles-dorados', 'Decoración paneles dorados', (SELECT id FROM categories WHERE slug='decoraciones'), 0, '[]', 3),
  ('decoracion-merlina', 'Decoración de Merlina', (SELECT id FROM categories WHERE slug='decoraciones'), 0, '[]', 4),
  ('decoracion-sirenita', 'Decoración de sirenita', (SELECT id FROM categories WHERE slug='decoraciones'), 0, '[]', 5),
  ('tematica-futbol', 'Temática fútbol', (SELECT id FROM categories WHERE slug='decoraciones'), 1, '[]', 6),
  ('decoracion-jefe-en-panales', 'Decoración Jefe en pañales', (SELECT id FROM categories WHERE slug='decoraciones'), 0, '[]', 7),
  ('decoracion-baby-shower', 'Decoración baby shower', (SELECT id FROM categories WHERE slug='decoraciones'), 0, '[]', 8),
  ('decoracion-matrimonio', 'Decoración de matrimonio', (SELECT id FROM categories WHERE slug='decoraciones'), 0, '[]', 9),
  ('balde-con-flores', 'Balde con flores', (SELECT id FROM categories WHERE slug='floristeria'), 0, '[]', 10),
  ('balde-flores-globo-burbuja', 'Balde con flores y globo burbuja personalizado', (SELECT id FROM categories WHERE slug='floristeria'), 1, '["nuevo"]', 11),
  ('flores-y-fruta', 'Flores y fruta', (SELECT id FROM categories WHERE slug='floristeria'), 0, '[]', 12),
  ('flores-dia-de-la-madre', 'Flores día de la madre', (SELECT id FROM categories WHERE slug='floristeria'), 0, '[]', 13),
  ('desayuno-sorpresa', 'Desayuno sorpresa', (SELECT id FROM categories WHERE slug='desayunos'), 0, '[]', 14),
  ('desayuno-con-flores', 'Desayuno con flores', (SELECT id FROM categories WHERE slug='desayunos'), 1, '["mas-pedido"]', 15),
  ('cajita-feliz', 'Cajita feliz', (SELECT id FROM categories WHERE slug='detalles-y-anchetas'), 0, '[]', 16),
  ('velitas-con-deseos', 'Velitas con deseos personalizados', (SELECT id FROM categories WHERE slug='detalles-y-anchetas'), 0, '[]', 17);

INSERT INTO product_occasions (product_id, occasion_id)
SELECT p.id, o.id FROM products p, occasions o WHERE
     (p.slug IN ('arco-en-globos','decoracion-en-globos','decoracion-paneles-dorados') AND o.slug IN ('cumpleanos','eventos'))
  OR (p.slug = 'decoracion-paneles-dorados' AND o.slug = 'matrimonio')
  OR (p.slug IN ('decoracion-merlina','decoracion-sirenita','tematica-futbol') AND o.slug = 'infantil')
  OR (p.slug IN ('decoracion-jefe-en-panales','decoracion-baby-shower') AND o.slug = 'baby-shower')
  OR (p.slug = 'decoracion-matrimonio' AND o.slug = 'matrimonio')
  OR (p.slug IN ('balde-con-flores','balde-flores-globo-burbuja','desayuno-sorpresa') AND o.slug IN ('cumpleanos','amor-y-amistad'))
  OR (p.slug IN ('flores-y-fruta','desayuno-con-flores') AND o.slug IN ('cumpleanos','dia-de-la-madre'))
  OR (p.slug = 'flores-dia-de-la-madre' AND o.slug IN ('dia-de-la-madre','para-ella'))
  OR (p.slug = 'cajita-feliz' AND o.slug IN ('cumpleanos','infantil'))
  OR (p.slug = 'velitas-con-deseos' AND o.slug = 'cumpleanos');

-- Tamaños y colores de ejemplo para floristería y desayunos (editables en el panel).
INSERT INTO product_options (product_id, kind, name, color_hex, sort_order)
SELECT id, 'size', 'Pequeño', NULL, 1 FROM products WHERE slug IN ('balde-con-flores','balde-flores-globo-burbuja','flores-y-fruta','flores-dia-de-la-madre','desayuno-sorpresa','desayuno-con-flores');
INSERT INTO product_options (product_id, kind, name, color_hex, sort_order)
SELECT id, 'size', 'Mediano', NULL, 2 FROM products WHERE slug IN ('balde-con-flores','balde-flores-globo-burbuja','flores-y-fruta','flores-dia-de-la-madre','desayuno-sorpresa','desayuno-con-flores');
INSERT INTO product_options (product_id, kind, name, color_hex, sort_order)
SELECT id, 'size', 'Grande', NULL, 3 FROM products WHERE slug IN ('balde-con-flores','balde-flores-globo-burbuja','flores-y-fruta','flores-dia-de-la-madre','desayuno-sorpresa','desayuno-con-flores');
INSERT INTO product_options (product_id, kind, name, color_hex, sort_order)
SELECT id, 'color', 'Rosado', '#F4A6BF', 4 FROM products WHERE slug IN ('balde-con-flores','balde-flores-globo-burbuja','flores-y-fruta','flores-dia-de-la-madre','desayuno-sorpresa','desayuno-con-flores');
INSERT INTO product_options (product_id, kind, name, color_hex, sort_order)
SELECT id, 'color', 'Rojo', '#C8323C', 5 FROM products WHERE slug IN ('balde-con-flores','balde-flores-globo-burbuja','flores-y-fruta','flores-dia-de-la-madre','desayuno-sorpresa','desayuno-con-flores');
INSERT INTO product_options (product_id, kind, name, color_hex, sort_order)
SELECT id, 'color', 'Amarillo', '#F2C94C', 6 FROM products WHERE slug IN ('balde-con-flores','balde-flores-globo-burbuja','flores-y-fruta','flores-dia-de-la-madre','desayuno-sorpresa','desayuno-con-flores');
INSERT INTO product_options (product_id, kind, name, color_hex, sort_order)
SELECT id, 'color', 'Blanco', '#F4F1F2', 7 FROM products WHERE slug IN ('balde-con-flores','balde-flores-globo-burbuja','flores-y-fruta','flores-dia-de-la-madre','desayuno-sorpresa','desayuno-con-flores');

-- Adicionales disponibles en todos los productos al inicio.
INSERT INTO product_addons (product_id, addon_id) SELECT p.id, a.id FROM products p, addons a;

INSERT INTO settings (key, value) VALUES
  ('business', '{"name":"Detalle TM","tagline":"Detalles | Decoraciones | Floristería","coverage":"Bogotá","owner":"Marcela Ramírez"}'),
  ('theme', '{"primary":"#D64F48","pink":"#F7C5D5","pinkLight":"#FBE3EB","gold":"#F2B84B","lilac":"#E6DDF3","ink":"#2A1F24","muted":"#6A5560","background":"#FFFFFF","fontDisplay":"Fredoka","fontBody":"Nunito","imageRatio":"4 / 5","radius":24}'),
  ('whatsapp', '{"number":"573108540601","genericMessage":"Hola Detalle TM, quiero hacer una consulta."}'),
  ('prices', '{"showGlobal":false,"currency":"COP"}'),
  ('checkout', '{"cities":["Bogotá"],"fields":[{"id":"name","label":"Nombre completo","required":true},{"id":"phone","label":"Celular","required":true},{"id":"address","label":"Dirección","required":true},{"id":"neighborhood","label":"Barrio","required":true},{"id":"city","label":"Ciudad","required":true},{"id":"date","label":"Fecha de entrega","required":false},{"id":"slot","label":"Franja","required":false},{"id":"recipient","label":"¿Quién recibe? (nombre y celular)","required":false},{"id":"notes","label":"Notas","required":false}]}'),
  ('social', '{"instagram":"https://www.instagram.com/detalletm/"}'),
  ('seo', '{"title":"Detalle TM — Detalles, decoraciones y floristería en Bogotá","description":"Desayunos sorpresa, flores, anchetas y decoraciones con globos en Bogotá. Arma tu pedido y cotízalo por WhatsApp."}'),
  ('analytics', '{"ga4":""}'),
  ('quote_counter', '0');

INSERT INTO pages (slug, title, body) VALUES
  ('nosotros', 'Nosotros', 'En Detalle TM convertimos las fechas importantes en momentos que se recuerdan. Somos un emprendimiento bogotano liderado por Marcela Ramírez, dedicado a crear detalles, decoraciones y arreglos florales hechos a mano.

Cada pedido se arma pensando en quien lo recibe: elegimos contigo las flores, los colores y los acabados, y lo entregamos en Bogotá listo para sorprender.

Desayunos sorpresa, baldes con flores, arcos de globos, temáticas infantiles, baby showers y matrimonios. Cuéntanos qué quieres celebrar y lo diseñamos para ti.'),
  ('preguntas-frecuentes', 'Preguntas frecuentes', '¿Cómo hago un pedido?
Agrega productos al carrito, completa tus datos y envía la cotización por WhatsApp. Te respondemos con el precio y la disponibilidad.

¿A dónde entregan?
Por ahora hacemos entregas en Bogotá.

¿Con cuánta anticipación debo pedir?
[Completar desde el panel]

Políticas de entrega y cambios
[Completar desde el panel]');
