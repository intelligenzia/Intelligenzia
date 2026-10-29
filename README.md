# Intelligenzia

Website for Intelligenzia ry — a bilingual (Finnish / English) cognitive-science
association site with a blog, content pages, a vocabulary glossary, and a Stripe-backed
membership system.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **next-intl** for i18n — Finnish (default, unprefixed) and English (`/en`)
- **Tailwind CSS v4** + Radix UI / shadcn components
- **Prisma** + **PostgreSQL** (Supabase) for users and memberships
- **NextAuth v5** (database sessions) with magic-link sign-in via **Resend**
- **Stripe** for full (annual subscription) and supporting (pay-what-you-want) memberships
- Content authored as Markdown/MDX under `src/content`
- Deployed on **Netlify** (`@netlify/plugin-nextjs`)

## Getting started

```bash
bun install          # installs deps and runs `prisma generate`
cp .env.example .env # then fill in the values
bun run dev          # http://localhost:3000
```

Requires a running Postgres database (see `DATABASE_URL`). Apply the schema with:

```bash
bunx prisma db push   # or: bunx prisma migrate dev
```

## Environment

See [.env.example](.env.example) for the full list. Key groups:

- **Database** — `DATABASE_URL` (Supabase pooler for prod, direct connection for local)
- **Auth** — `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AUTH_RESEND_KEY`, `FROM_EMAIL`
- **Stripe** — secret/publishable keys, `STRIPE_WEBHOOK_SECRET`, and the price/product IDs
- **Analytics** — `NEXT_PUBLIC_UMAMI_*`

## Project layout

```
src/
  app/[locale]/        Localized routes (Finnish + English page dirs)
  app/api/             Route handlers: auth, stripe (checkout/portal/webhook), user
  content/             Markdown blog posts and pages, per locale
  lib/                 content loader, prisma, stripe, auth helpers
  i18n/                next-intl routing + request config
  messages/            UI translation strings (fi.json, en.json)
  middleware.ts        Locale handling + legacy-URL redirects
prisma/schema.prisma   User / Session / Membership models
```

## Membership flow

1. **Join** (`/jaseneksi`, `/en/join`): pick full (€10/yr subscription) or supporting
   (one-off, pay what you want). No account needed; signed-in members get renewal and
   upgrade options worked out by `planCheckout()` in [src/lib/membership.ts](src/lib/membership.ts).
2. **Pay** on Stripe Checkout, which collects the email and full name.
3. **Thanks** (`/jaseneksi/kiitos`): runs `fulfillCheckoutSession()` and shows the result.
   The webhook runs the same idempotent function, so whichever arrives first records the
   membership and sends the one confirmation email.
4. **My membership** (`/jasenyys`): magic-link sign-in with the email used to pay.
   Full members manage card, receipts and renewal in the Stripe billing portal.

Rules: supporting memberships can be renewed 60 days before they end (the new year starts
from the old end date). Supporting -> full is allowed any time; billing starts when the paid
period ends. A live subscription can't be bought twice.

## Stripe webhooks

Fulfilment and subscription sync live in [src/lib/membership-sync.ts](src/lib/membership-sync.ts);
the endpoint is [src/app/api/stripe/webhook/route.ts](src/app/api/stripe/webhook/route.ts).
For local testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Scripts

- `bun run dev` — dev server
- `bun run build` — `prisma generate` + `next build`
- `bun run start` — production server
- `bun run lint` — ESLint

## Deployment

Deployed to Netlify; configuration in [netlify.toml](netlify.toml). Set the same
environment variables in the Netlify dashboard, and point a Stripe production webhook
at `https://intelligenzia.fi/api/stripe/webhook`.

Production checklist for memberships:

- [ ] Netlify env: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AUTH_RESEND_KEY`,
      `FROM_EMAIL`, `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET` (live endpoint),
      `STRIPE_FULL_MEMBERSHIP_PRICE_ID`, `STRIPE_SUPPORTING_MEMBERSHIP_PRODUCT_ID`
- [ ] Stripe webhook subscribed to the events listed in `.env.example`
- [ ] Stripe → Settings → Billing → Customer portal: save the configuration once in live
      mode (allow cancel, update payment method, invoice history); the portal errors until then
- [ ] Stripe → Settings → Customer emails: turn on receipts for successful payments
- [ ] Stripe → Settings → Payment methods: enable the wallets you want (Apple Pay, Google
      Pay, MobilePay); checkout offers whatever is enabled
- [ ] Resend: `FROM_EMAIL` domain verified (SPF/DKIM), or magic links land in spam
