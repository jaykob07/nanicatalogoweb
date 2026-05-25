-- Crear vista para obtener las categorías de productos de forma única y ordenada
CREATE OR REPLACE VIEW public.product_categories AS
SELECT DISTINCT UPPER(TRIM(split_part(name, ' ', 1))) AS tag
FROM public.products
WHERE length(split_part(name, ' ', 1)) > 2
ORDER BY tag;
