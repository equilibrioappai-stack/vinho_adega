alter table suppliers add column if not exists hero_image_url text;

-- suppliers_public precisa incluir a coluna nova pro catálogo público conseguir ler
create or replace view suppliers_public as
  select id, business_name, slug, whatsapp_number, cart_greeting, theme_color, hero_image_url
  from suppliers;

grant select on suppliers_public to anon, authenticated;
