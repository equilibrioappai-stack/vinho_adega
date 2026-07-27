-- Remove os fornecedores de teste (A, B, Juliana, João da Sidra) e seus
-- vinhos/favoritos (cascata via foreign key).
delete from suppliers where slug in ('fornecedor-teste-a', 'fornecedor-teste-b', 'juliana', 'JOAO');

-- Remove só os usuários de teste que NÃO são o seu login do /painel
-- (equilibrio.appai@gmail.com, usado como auth_user_id do fornecedor-teste-b,
-- fica intacto).
delete from auth.users where id in (
  '5fe0df1d-00a5-4043-a084-6ac342f652bc', -- Fornecedor Teste A (alessandradsm@gmail.com)
  'fcda6a65-87ec-4f6d-88f5-d8fd37c3e556'  -- João da Sidra (teste do /painel)
);

-- conferência: deve vir vazio
select business_name, slug from suppliers;
