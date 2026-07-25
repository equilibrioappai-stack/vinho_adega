-- Fase 1 (limpeza): remove duplicatas geradas por execuções repetidas do
-- seed de teste (003), mantendo só a linha de menor id por (supplier_id, name).
delete from wines w
using wines dup
where w.supplier_id = dup.supplier_id
  and w.name = dup.name
  and w.id > dup.id;

-- conferência: deve dar 134
select count(*) from wines;
