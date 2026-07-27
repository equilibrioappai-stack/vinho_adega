-- Remove os fornecedores de teste (A, B, Juliana) e seus vinhos/favoritos
-- (cascata via foreign key). NÃO apaga o login equilibrio.appai@gmail.com,
-- que é o seu acesso ao /painel.
delete from suppliers where slug in ('fornecedor-teste-a', 'fornecedor-teste-b', 'juliana');

-- Remove o usuário de teste da Alessandra (não é usado em mais nada).
delete from auth.users where email = 'alessandradsm@gmail.com';

-- conferência: deve vir vazio
select business_name, slug from suppliers;
