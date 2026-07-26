-- Redesign editorial: campos de ficha técnica, todos opcionais.
-- Vinhos existentes continuam funcionando sem esses dados preenchidos.

alter table wines add column if not exists winery text;
alter table wines add column if not exists region text;
alter table wines add column if not exists grape text;
alter table wines add column if not exists vintage text;
alter table wines add column if not exists abv text;
alter table wines add column if not exists food_pairing text;
alter table wines add column if not exists serving_temp text;
alter table wines add column if not exists description text;
alter table wines add column if not exists sommelier_pick boolean not null default false;
