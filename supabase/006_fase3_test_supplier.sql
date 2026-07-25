-- Fase 3: cadastro de um terceiro fornecedor de teste, feito só com SQL
-- (sem tocar em código), pra confirmar que o carrinho usa o WhatsApp e a
-- saudação certos automaticamente.
--
-- Troque '<UUID_DE_UM_USUARIO_DE_TESTE>' por um auth_user_id válido
-- (crie um terceiro usuário em Authentication → Users, com Auto Confirm,
-- e cole o UUID dele aqui).

insert into suppliers (auth_user_id, business_name, slug, whatsapp_number, cart_greeting, theme_color)
values (
  '<UUID_DE_UM_USUARIO_DE_TESTE>',
  'Vinhos da Juliana',
  'juliana',
  '5511988887777',
  'Oi! Bora fechar esse pedido de vinhos:',
  '#2E5E4E'
)
on conflict (slug) do nothing;
