# VELUM

Meditation, breathwork, and nervous system regulation app.

## What it is
Premium wellness platform helping users regulate their nervous system through guided audio practices, interactive tools, and structured courses. Core thesis: move from survival mode to a regulated, creative state through evidence-based practices (meditation, breathwork, tapping/EFT, journaling).

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI)
- **State**: TanStack React Query (server state)
- **Routing**: React Router 6
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Stripe (monthly + lifetime subscription)
- **Push notifications**: OneSignal
- **Email marketing**: Loops

## Key Features
- Interactive breathwork with animated orb (6 techniques)
- Audio player for meditation, tapping, journaling tracks
- Mastery Classes (audio journeys with mid-session pause prompts)
- Courses (structured multi-lesson programs)
- Nervous system stress tracking (pre/post session ratings 1-10)
- Daily journal reflections
- Session finder (quiz-based recommendation engine)
- Admin CMS (track/course/mastery class management)
- Subscription gating (paywall modal for premium content)

## Content Types
- **Tracks** — meditation, rapid_resets, breathwork, tapping, journaling sessions
- **Courses** (v2) — structured multi-lesson programs with modules
- **Mastery Classes** — advanced audio journeys with timestamped pause prompts
- **Journaling Prompts** — daily rotation

## Supabase Project
- Project ID: `icwcszaasekfhzpxrxzd`
- URL: `https://icwcszaasekfhzpxrxzd.supabase.co`
- Edge Functions: `create-checkout`, `cancel-subscription`, `loops-signup`, `auth-email-hook`, `process-email-queue`

## Auth
- Email/password, magic link, Google OAuth, Apple OAuth
- All OAuth via Supabase `signInWithOAuth()` in `src/integrations/supabase/oauth.ts`
- Admin role detected via `user_roles` table

## Revenue Model
- Monthly subscription + Lifetime plan via Stripe
- Promo code support on premium page

## Dev
```bash
npm run dev       # local dev server
npm run build     # production build
npm run test      # vitest
```

## Env vars needed
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```
