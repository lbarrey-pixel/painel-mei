# Painel MEI

Painel administrativo de um escritório de contabilidade para a rotina mensal das guias DAS-MEI
dos clientes: cadastro, regra padrão de aviso (dia do mês, margem de atraso, canal, texto da
mensagem), exceções por cliente, pausa/débito automático, importação e exportação em CSV e
controle de quem entra no painel por lista de e-mails.

O envio das mensagens em si fica com um robô separado, que lê o template e o canal configurados
aqui (WhatsApp Web hoje; a API oficial da Meta entra com o mesmo contrato de variáveis).

*[English below](#english)*

> Versão de portfólio. O sistema roda em produção para um escritório real; aqui a marca é
> fictícia e os dados de exemplo também. O código em produção é privado por contrato.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components, middleware) + TypeScript
- [Supabase](https://supabase.com): Postgres, Auth (Google OAuth) via `@supabase/ssr`, Row
  Level Security
- Tailwind CSS 4
- Vitest para a lógica pura; ESLint (`eslint-config-next`); CI no GitHub Actions com um job
  separado que sobe um Postgres limpo, aplica a migration e testa o RLS

## Como a segurança funciona

Não há backend próprio: o navegador fala direto com o Supabase usando a chave pública e a
sessão do usuário. Isso só é seguro porque **toda regra de acesso está no banco**, versionada em
`supabase/migrations/0001_schema.sql`:

- `allowed_emails` guarda quem pode entrar. `tem_acesso()` (security definer) confere o e-mail
  do JWT contra essa tabela.
- Policies em `clientes`, `config_geral` e `allowed_emails` exigem `tem_acesso()` para ler e
  gravar; `config_geral` só aceita `update` (uma linha, nunca criada nem apagada pelo app).
- O papel `anon` não tem grant em nada.
- O middleware (`src/lib/supabase/middleware.ts`) renova a sessão por cookies e redireciona para
  `/login` ou `/acesso-negado`, mas isso é conveniência de UX; a barreira real é o RLS.
- O CNPJ é validado pelos dígitos verificadores no front (`src/lib/cnpj.ts`) **e** por `check`
  no banco (`cnpj_valido()`), então um import mal feito não passa nem direto pela API.

`supabase/tests/rls.sql` prova isso num Postgres comum: um usuário liberado lê, altera e insere;
um intruso autenticado vê zero linhas e não consegue gravar. O CI roda esse arquivo a cada push.

## Rodar local

```bash
npm install
cp .env.example .env.local        # URL e chave anon do projeto Supabase
npm run dev                       # http://localhost:3000
```

No projeto Supabase:

1. Ative o provedor Google em Authentication → Providers e cadastre
   `http://localhost:3000/auth/callback` como redirect.
2. Rode `supabase/migrations/0001_schema.sql` e depois `supabase/seed.sql` no SQL Editor,
   trocando `voce@example.com` pelo e-mail da sua conta Google.

Sem Supabase, dá para validar o resto:

```bash
npm test               # cnpj, csv, mensagem
npm run typecheck && npm run lint && npm run build
```

Para rodar a migration e o teste de RLS num Postgres local (16+):

```bash
psql -f supabase/tests/stub_auth.sql     # imita auth.jwt() e os papéis do Supabase
psql -f supabase/migrations/0001_schema.sql
psql -f supabase/seed.sql
psql -f supabase/tests/rls.sql            # termina com "RLS ok"
```

## Estrutura

| Caminho | O que é |
| --- | --- |
| `src/middleware.ts`, `src/lib/supabase/` | Sessão SSR por cookies, clients server/browser, allowlist |
| `src/app/page.tsx`, `ClientesTable.tsx`, `ClienteModal.tsx` | Lista, CRUD, pausa, exceções por cliente, import/export CSV |
| `src/app/config/` | Regra padrão da rotina e gestão da allowlist |
| `src/app/auth/callback/route.ts` | Troca do código OAuth por sessão (destino pós-login validado) |
| `src/lib/cnpj.ts`, `csv.ts`, `mensagem.ts` | Lógica pura, coberta por testes |
| `supabase/migrations/` | Schema, funções, RLS e grants |
| `supabase/seed.sql`, `supabase/tests/` | Dados fictícios, stub do auth e teste de policies |

## Decisões

- **Sem API própria.** Para um CRUD de poucas tabelas com um só perfil de usuário, o Supabase
  com RLS entrega menos código e menos superfície do que um backend intermediário. A condição é
  tratar a migration como código de produção, com teste.
- **Allowlist em tabela, editável pelo painel.** O escritório libera e revoga acesso sem mexer
  em configuração; o próprio usuário é avisado antes de remover o próprio e-mail.
- **Import CSV tudo-ou-nada.** Cada linha é validada antes de qualquer gravação; o `upsert` por
  CNPJ torna o reimport idempotente.
- **Regra padrão + exceções.** `config_geral` tem a regra do escritório; campos `*_override`
  em `clientes` sobrescrevem só o que for diferente, com `null` significando "usa o padrão".

---

## English

**Painel MEI** is an admin panel for an accounting firm's monthly DAS-MEI routine: client
registry, default notification rule (day of month, late margin, channel, message template),
per-client overrides, pause/auto-debit flags, CSV import/export, and an email allowlist that
controls who can sign in. Message delivery itself is handled by a separate bot that reads the
template and channel configured here.

> Portfolio version: the system runs in production for a real firm; branding and sample data
> here are fictional, and the production code is private under contract.

**Stack:** Next.js 16 (App Router, Server Components, middleware) + TypeScript · Supabase
(Postgres, Google OAuth via `@supabase/ssr`, Row Level Security) · Tailwind CSS 4 · Vitest ·
ESLint · GitHub Actions with a separate job that spins up a clean Postgres, applies the migration
and runs the RLS test.

**Security model:** there is no custom backend; the browser talks to Supabase with the public key
and the user's session. That only works because every access rule lives in the database
(`supabase/migrations/0001_schema.sql`): `allowed_emails` + a `security definer` function
`tem_acesso()` checked by every policy; `anon` has no grants; `config_geral` is update-only.
The middleware redirects for UX, but RLS is the real barrier. CNPJ check digits are validated on
the client and again by a `check` constraint. `supabase/tests/rls.sql` proves it on plain
Postgres (allowed user reads/writes, authenticated intruder sees zero rows) and CI runs it on
every push.

**Run:** `npm install`, copy `.env.example` to `.env.local`, `npm run dev`. In Supabase, enable
the Google provider with `http://localhost:3000/auth/callback` as redirect and run the migration
and seed (replace `voce@example.com`). Without Supabase: `npm test`, `npm run typecheck`,
`npm run lint`, `npm run build`; for the DB, apply `supabase/tests/stub_auth.sql`, the migration,
the seed and `supabase/tests/rls.sql` on a local Postgres 16+.

**Design notes:** no custom API for a small single-role CRUD — Supabase with tested RLS is less
code and less surface; allowlist as a table editable from the panel; all-or-nothing CSV import
with idempotent upsert by CNPJ; firm-wide defaults plus nullable per-client overrides.
