-- Fase visual: imagem por vinho + destaques com janela de validade automática.

alter table wines add column if not exists image_url text;
alter table wines add column if not exists featured_from date;
alter table wines add column if not exists featured_until date;

-- 1. No Supabase Dashboard → Storage → New bucket:
--    nome: wine-images
--    marque "Public bucket" (permite leitura pública das imagens, sem precisar
--    de policy de SELECT separada)
--
-- 2. Depois de criar o bucket, rode o resto deste arquivo pra restringir quem
--    pode enviar/apagar imagens: cada fornecedor só mexe na própria pasta,
--    identificada pelo supplier_id no início do caminho do arquivo
--    (ex: "3f2a.../garrafa.jpg").

drop policy if exists "supplier uploads own wine images" on storage.objects;
create policy "supplier uploads own wine images" on storage.objects
  for insert
  with check (
    bucket_id = 'wine-images'
    and (storage.foldername(name))[1] = (
      select id::text from suppliers where auth_user_id = auth.uid()
    )
  );

drop policy if exists "supplier updates own wine images" on storage.objects;
create policy "supplier updates own wine images" on storage.objects
  for update
  using (
    bucket_id = 'wine-images'
    and (storage.foldername(name))[1] = (
      select id::text from suppliers where auth_user_id = auth.uid()
    )
  );

drop policy if exists "supplier deletes own wine images" on storage.objects;
create policy "supplier deletes own wine images" on storage.objects
  for delete
  using (
    bucket_id = 'wine-images'
    and (storage.foldername(name))[1] = (
      select id::text from suppliers where auth_user_id = auth.uid()
    )
  );
