# Painel MEI

> Portfolio sample of a system running in production for a real firm. The brand is
> fictional, and the data here is fictional. The full production code is private under
> contract.

Administrative panel for an accounting firm, for the monthly routine of clients'
DAS-MEI payment slips (DAS-MEI: the monthly tax payment slip for an MEI, Brazil's
individual micro-entrepreneur status): client registry, default notification rule (day of
the month, late margin, channel, message text), per-client exceptions, pause/automatic
debit, CSV import and export, and control of who can enter the panel through an email
list.

Message delivery itself is left to a separate bot, which reads the template and the
channel configured here (WhatsApp Web today; Meta's official API plugs in with the same
variable contract).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components, middleware) + TypeScript
- [Supabase](https://supabase.com): Postgres, Auth (Google OAuth) via `@supabase/ssr`, Row
  Level Security
- Tailwind CSS 4
- Vitest for the pure logic; ESLint (`eslint-config-next`); GitHub Actions CI with a
  separate job that starts a clean Postgres, applies the migration, and tests RLS

## How security works

There is no custom backend: the browser talks directly to Supabase using the public key
and the user's session. This is safe only because **every access rule lives in the
database**, versioned in `supabase/migrations/0001_schema.sql`:

- `allowed_emails` stores who may sign in. `tem_acesso()` (security definer) checks the
  JWT email against that table.
- Policies on `clientes`, `config_geral`, and `allowed_emails` require `tem_acesso()` to
  read and write; `config_geral` accepts only `update` (one row, never created or deleted
  by the app).
- The `anon` role has no grants on anything.
- The middleware (`src/lib/supabase/middleware.ts`) refreshes the session via cookies and
  redirects to `/login` or `/acesso-negado`, but that is a UX convenience; the real
  barrier is RLS.
- The CNPJ (Brazilian company tax ID) is validated by its check digits on the front end
  (`src/lib/cnpj.ts`) **and** by a `check` in the database (`cnpj_valido()`), so a badly
  done import does not get through even directly via the API.

`supabase/tests/rls.sql` proves this on ordinary Postgres: an allowed user reads, updates,
and inserts; an authenticated intruder sees zero rows and cannot write. CI runs that file
on every push.

## Run locally

```bash
npm install
cp .env.example .env.local        # Supabase project URL and anon key
npm run dev                       # http://localhost:3000
```

In the Supabase project:

1. Enable the Google provider under Authentication → Providers and register
   `http://localhost:3000/auth/callback` as the redirect.
2. Run `supabase/migrations/0001_schema.sql` and then `supabase/seed.sql` in the SQL
   Editor, replacing `voce@example.com` with the email of your Google account.

Without Supabase, the rest can still be checked:

```bash
npm test               # cnpj, csv, mensagem
npm run typecheck && npm run lint && npm run build
```

To run the migration and the RLS test on a local Postgres (16+):

```bash
psql -f supabase/tests/stub_auth.sql     # mimics auth.jwt() and the Supabase roles
psql -f supabase/migrations/0001_schema.sql
psql -f supabase/seed.sql
psql -f supabase/tests/rls.sql            # ends with "RLS ok"
```

## Structure

| Path | What it is |
| --- | --- |
| `src/middleware.ts`, `src/lib/supabase/` | SSR session via cookies, server/browser clients, allowlist |
| `src/app/page.tsx`, `ClientesTable.tsx`, `ClienteModal.tsx` | List, CRUD, pause, per-client exceptions, CSV import/export |
| `src/app/config/` | Default rule for the routine and allowlist management |
| `src/app/auth/callback/route.ts` | OAuth code exchanged for a session (validated post-login destination) |
| `src/lib/cnpj.ts`, `csv.ts`, `mensagem.ts` | Pure logic, covered by tests |
| `supabase/migrations/` | Schema, functions, RLS, and grants |
| `supabase/seed.sql`, `supabase/tests/` | Fictional data, auth stub, and policy test |

## Decisions

- **No custom API.** For a CRUD of a few tables with a single user role, Supabase with
  RLS delivers less code and less surface than an intermediate backend. The condition is
  to treat the migration as production code, with a test.
- **Allowlist in a table, editable from the panel.** The firm grants and revokes access
  without touching configuration; the user is warned before removing their own email.
- **All-or-nothing CSV import.** Each row is validated before any write; the `upsert` by
  CNPJ makes reimport idempotent.
- **Default rule plus exceptions.** `config_geral` holds the firm's rule; `*_override`
  fields on `clientes` override only what differs, with `null` meaning "use the default".
