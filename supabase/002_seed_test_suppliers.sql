-- Fase 1: cadastro dos dois fornecedores de teste usados para validar o
-- isolamento por RLS. Rode no SQL Editor depois do 001_foundation.sql.
-- (nenhum é o Matheus real ainda — isso fica pra quando o isolamento
-- estiver validado)

insert into suppliers (auth_user_id, business_name, slug, whatsapp_number, cart_greeting)
values
  ('5fe0df1d-00a5-4043-a084-6ac342f652bc', 'Fornecedor Teste A', 'fornecedor-teste-a', '5500000000000', 'Olá! Gostaria de fazer um pedido:'),
  ('a9355dd1-6ee3-4c1e-bec4-64e7e213737d', 'Fornecedor Teste B', 'fornecedor-teste-b', '5500000000001', 'Olá! Gostaria de fazer um pedido:')
on conflict (slug) do nothing;
