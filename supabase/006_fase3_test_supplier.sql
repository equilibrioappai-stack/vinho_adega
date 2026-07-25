-- Fase 3: cadastro de um terceiro fornecedor de teste, feito só com SQL
-- (sem tocar em código), pra confirmar que o carrinho usa o WhatsApp, a
-- saudação e a cor certos automaticamente.
--
-- auth_user_id fica NULL de propósito: para este teste (catálogo público
-- + carrinho) não é preciso logar no /admin. Se depois quiser dar acesso
-- ao painel pra esse fornecedor, crie um usuário em Authentication → Users
-- e rode: update suppliers set auth_user_id = '<uuid>' where slug = 'juliana';

insert into suppliers (auth_user_id, business_name, slug, whatsapp_number, cart_greeting, theme_color)
values (
  null,
  'Vinhos da Juliana',
  'juliana',
  '5511988887777',
  'Oi! Bora fechar esse pedido de vinhos:',
  '#2E5E4E'
)
on conflict (slug) do nothing;
