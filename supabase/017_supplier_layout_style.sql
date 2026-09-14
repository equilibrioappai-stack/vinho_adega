-- Permite que cada fornecedor escolha o estilo visual do catálogo público.
-- Valores esperados: 'editorial' (padrão, atual), 'vitrine' (grid com fotos
-- em destaque), 'compacta' (lista densa sem fotos, pra catálogos grandes).
-- A validação do valor é feita no frontend; aqui fica livre (texto) pra não
-- exigir migração toda vez que um novo estilo for adicionado.

alter table suppliers
  add column if not exists layout_style text not null default 'editorial';

-- suppliers_public precisa expor a coluna nova pro catálogo público conseguir ler
create or replace view suppliers_public as
  select id, business_name, slug, whatsapp_number, cart_greeting, theme_color, hero_image_url, logo_url, layout_style
  from suppliers;

grant select on suppliers_public to anon, authenticated;
