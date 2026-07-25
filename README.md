# Adega Selecionada — Catálogo Digital Multi-Fornecedor

## Estrutura do projeto

```
supabase/
  001_foundation.sql        ← schema multi-tenant (suppliers, wines.supplier_id, RLS)
  002-005_*.sql              ← seed/limpeza dos dados de teste
  scripts/                   ← scripts auxiliares (get_uids, test_rls)
src/
  data/
    wines.js          ← estoque original (usado só pelo catálogo público legado, até a Fase 2)
  components/
    WineContext.jsx   ← estado compartilhado do catálogo público + carrinho
  pages/
    Catalog.jsx       ← catálogo público (rota /, ainda não roteado por fornecedor)
    Admin.jsx         ← painel do fornecedor (rota /admin, login via Supabase Auth)
  supabase.js         ← client do Supabase
  App.jsx             ← roteamento
  main.jsx            ← entrada
  index.css           ← fontes + reset
```

## Rotas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Catálogo público (ainda de um fornecedor fixo — rotas por fornecedor chegam na Fase 2) |
| `/admin` | Supabase Auth (e-mail/senha) | Painel do fornecedor logado: só enxerga e edita o próprio catálogo (RLS) |

## Variáveis de ambiente

Configure no Netlify (Site configuration → Environment variables) e localmente em `.env.local` (não versionado):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Veja `.env.example`.

## Persistência

O catálogo do painel admin (`/admin`) já é 100% Supabase, com isolamento por fornecedor via Row Level Security — ver `supabase/001_foundation.sql`. O catálogo público (`/`) e o carrinho ainda usam os dados locais de `src/data/wines.js`; a migração completa para Supabase com rota por fornecedor é a Fase 2.

## Dependências

- React 18
- React Router DOM 6
- Vite 5
- @supabase/supabase-js
