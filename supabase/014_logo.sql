alter table suppliers add column if not exists logo_url text;

create or replace view suppliers_public as
  select id, business_name, slug, whatsapp_number, cart_greeting, theme_color, hero_image_url, logo_url
  from suppliers;

grant select on suppliers_public to anon, authenticated;
