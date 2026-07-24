-- Fase 1: teste de isolamento RLS direto no SQL Editor (sem instalar nada).
-- Rode cada bloco (separado por "-- BLOCO N") de cada vez, um por vez,
-- e observe o resultado/erro antes de ir para o próximo.
--
-- Estes comandos simulam, dentro do próprio Postgres, exatamente o que a
-- API do Supabase faz quando um fornecedor autenticado chama a API
-- diretamente (não é um teste "de mentirinha" via interface).

-- BLOCO 1 — Fornecedor B lê o catálogo do Fornecedor A
-- Esperado: retorna linhas normalmente (leitura pública é permitida por design)
set role authenticated;
set request.jwt.claim.sub to 'a9355dd1-6ee3-4c1e-bec4-64e7e213737d';
select id, name from wines
where supplier_id = (select id from suppliers where slug = 'fornecedor-teste-a')
limit 3;
reset role;

-- BLOCO 2 — Fornecedor B tenta INSERIR um vinho no catálogo do Fornecedor A
-- Esperado: ERRO "new row violates row-level security policy for table wines"
set role authenticated;
set request.jwt.claim.sub to 'a9355dd1-6ee3-4c1e-bec4-64e7e213737d';
insert into wines (supplier_id, name, type, origin, price)
values ((select id from suppliers where slug = 'fornecedor-teste-a'), 'Invasão Teste', 'Tinto', 'ARGENTINA', 1);
reset role;

-- BLOCO 3 — Fornecedor A insere um vinho de verdade no próprio catálogo
-- Esperado: sucesso, retorna o id da linha criada (anote esse id)
set role authenticated;
set request.jwt.claim.sub to '5fe0df1d-00a5-4043-a084-6ac342f652bc';
insert into wines (supplier_id, name, type, origin, price)
values ((select id from suppliers where slug = 'fornecedor-teste-a'), 'Vinho Teste RLS', 'Tinto', 'ARGENTINA', 50)
returning id;
reset role;

-- BLOCO 4 — troque <ID_DO_BLOCO_3> pelo id anotado acima.
-- Fornecedor B tenta ATUALIZAR e DELETAR o vinho que pertence a A
-- Esperado: "UPDATE 0" e "DELETE 0" (nenhuma linha afetada, sem erro)
set role authenticated;
set request.jwt.claim.sub to 'a9355dd1-6ee3-4c1e-bec4-64e7e213737d';
update wines set price = 999 where id = <ID_DO_BLOCO_3>;
delete from wines where id = <ID_DO_BLOCO_3>;
reset role;

-- BLOCO 5 — limpeza: Fornecedor A apaga o próprio vinho de teste
-- (troque <ID_DO_BLOCO_3> de novo)
set role authenticated;
set request.jwt.claim.sub to '5fe0df1d-00a5-4043-a084-6ac342f652bc';
delete from wines where id = <ID_DO_BLOCO_3>;
reset role;
