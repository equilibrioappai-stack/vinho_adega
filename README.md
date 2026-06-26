# Adega Selecionada — Catálogo Digital

## Estrutura do projeto

```
src/
  data/
    wines.js          ← estoque completo (134 rótulos)
  components/
    WineContext.jsx   ← estado compartilhado + localStorage
  pages/
    Catalog.jsx       ← catálogo público (rota /)
    Admin.jsx         ← painel do fornecedor (rota /admin)
  App.jsx             ← roteamento
  main.jsx            ← entrada
  index.css           ← fontes + reset
```

## Rotas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Catálogo que o fornecedor manda no grupo |
| `/admin` | Senha | Painel para adicionar, editar e remover rótulos |

## Senha do painel admin

`adega2025`

Para mudar, edite a constante `ADMIN_PASSWORD` em `src/pages/Admin.jsx`.

## Como subir no Lovable

1. Crie um novo projeto no Lovable
2. Cole o conteúdo de cada arquivo nos caminhos correspondentes
3. O Lovable instala as dependências automaticamente
4. Deploy com um clique

## Persistência

As alterações feitas no painel admin ficam salvas via `localStorage` no navegador do fornecedor. Para persistência em banco de dados, a próxima evolução é conectar ao Supabase (o Lovable tem integração nativa).

## Dependências

- React 18
- React Router DOM 6
- Vite 5
