-- Limpa os vinhos importados com acentuação quebrada antes de reimportar.
delete from wines
where supplier_id = (select id from suppliers where slug = 'matheus-blackbox');
