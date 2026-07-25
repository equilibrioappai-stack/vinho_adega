-- Painel do dono: campos de controle comercial + acesso total (só pro seu
-- login) na tabela suppliers, sem afetar o isolamento entre fornecedores.

alter table suppliers add column if not exists contact_email text;
alter table suppliers add column if not exists start_date date;
alter table suppliers add column if not exists billing_day smallint check (billing_day between 1 and 31);

-- Você (equilibrio.appai@gmail.com) enxerga e edita TODOS os fornecedores,
-- além da policy normal de "só a própria linha" que já existe pra cada
-- fornecedor comum.
drop policy if exists "owner manages all suppliers" on suppliers;
create policy "owner manages all suppliers" on suppliers
  for all using (
    (auth.jwt() ->> 'email') = 'equilibrio.appai@gmail.com'
  ) with check (
    (auth.jwt() ->> 'email') = 'equilibrio.appai@gmail.com'
  );
