-- Fase 3: um vinho de teste no catálogo da Juliana, só pra testar o carrinho.
insert into wines (supplier_id, name, type, origin, price)
select id, 'Vinho de Teste da Juliana', 'Tinto', 'ARGENTINA', 99
from suppliers where slug = 'juliana';
