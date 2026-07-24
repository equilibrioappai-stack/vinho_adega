-- Fase 1: teste de isolamento RLS direto no SQL Editor (sem instalar nada).
-- Rode cada bloco (separado por "-- BLOCO N") de cada vez, um por vez,
-- e observe o resultado/erro antes de ir para o próximo.
--
-- Estes comandos simulam, dentro do próprio Postgres, exatamente o que a
-- API do Supabase faz quando um fornecedor autenticado chama a API
-- diretamente (não é um teste "de mentirinha" via interface).
--
-- Importante: o editor só mostra o resultado do ÚLTIMO comando do bloco,
-- por isso cada bloco termina no comando que realmente queremos ver.

-- BLOCO 1 — Fornecedor B lê o catálogo do Fornecedor A
-- Esperado: uma tabela com até 3 linhas (id, name) — leitura pública é permitida por design
set role authenticated;
set request.jwt.claim.sub to 'a9355dd1-6ee3-4c1e-bec4-64e7e213737d';
select id, name from wines
where supplier_id = (select id from suppliers where slug = 'fornecedor-teste-a')
limit 3;

-- BLOCO 2 — Fornecedor B tenta INSERIR um vinho no catálogo do Fornecedor A
-- Esperado: ERRO "new row violates row-level security policy for table wines"
set role authenticated;
set request.jwt.claim.sub to 'a9355dd1-6ee3-4c1e-bec4-64e7e213737d';
insert into wines (supplier_id, name, type, origin, price)
values ((select id from suppliers where slug = 'fornecedor-teste-a'), 'Invasão Teste', 'Tinto', 'ARGENTINA', 1);

-- BLOCO 3 — Fornecedor A insere um vinho de verdade no próprio catálogo
-- Esperado: uma tabela com 1 linha mostrando o id criado (anote esse id)
set role authenticated;
set request.jwt.claim.sub to '5fe0df1d-00a5-4043-a084-6ac342f652bc';
insert into wines (supplier_id, name, type, origin, price)
values ((select id from suppliers where slug = 'fornecedor-teste-a'), 'Vinho Teste RLS', 'Tinto', 'ARGENTINA', 50)
returning id;

-- BLOCO 4a — troque <ID_DO_BLOCO_3> pelo id anotado acima.
-- Fornecedor B tenta ATUALIZAR o vinho que pertence a A
-- Esperado: tabela VAZIA (0 linhas) — RLS bloqueou silenciosamente, sem erro
set role authenticated;
set request.jwt.claim.sub to 'a9355dd1-6ee3-4c1e-bec4-64e7e213737d';
update wines set price = 999 where id = <ID_DO_BLOCO_3> returning id, price;

-- BLOCO 4b — troque <ID_DO_BLOCO_3> de novo.
-- Fornecedor B tenta DELETAR o vinho que pertence a A
-- Esperado: tabela VAZIA (0 linhas) — RLS bloqueou silenciosamente, sem erro
set role authenticated;
set request.jwt.claim.sub to 'a9355dd1-6ee3-4c1e-bec4-64e7e213737d';
delete from wines where id = <ID_DO_BLOCO_3> returning id;

-- BLOCO 5 — limpeza: Fornecedor A apaga o próprio vinho de teste
-- (troque <ID_DO_BLOCO_3> de novo). Esperado: tabela com 1 linha (apagou com sucesso)
set role authenticated;
set request.jwt.claim.sub to '5fe0df1d-00a5-4043-a084-6ac342f652bc';
delete from wines where id = <ID_DO_BLOCO_3> returning id;
