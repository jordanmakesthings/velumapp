Memory: Velum app architecture, all pages, and key decisions.

## Design Tokens
- Background: #111111 | Surface/Card: #0F2F26 | Surface Light: #1a4a3a
- Cream (text): #F2EFE7 | Sage (muted): #6F8A7E | Gold (accent): #C9A84C
- Fonts: Cormorant Garamond (serif display), DM Sans (body/UI)
- Card radius: 18px, button radius: 10px
- Gold shadow cards: 0 0 0 1px rgba(201,168,76,0.15), 0 4px 12px rgba(0,0,0,0.4)

## CSS Classes
- `.velum-card` — card with gold shadow + hover
- `.velum-card-flat` — card without hover shadow
- `.text-display` — serif heading style
- `.text-ui` — sans muted body style
- `.gold-gradient` — accent gradient background
- `.bg-radial-subtle` — page background

## Architecture
- AppLayout with bottom nav (mobile) + sidebar (desktop)
- Nav hidden on: /onboarding, /premium, /welcome, /player, /mastery-player
- Full-screen pages outside AppLayout: onboarding, welcome, premium, player, mastery-player, admin
- Mobile-first, max-w-2xl centered content

## Pages Built
- / (Home), /library (tabbed), /breathe (interactive), /courses, /course/:id
- /profile (stats + chart), /journal (prompts + entries), /blueprint
- /onboarding (7-step flow), /welcome, /premium (paywall)
- /player (audio), /mastery-player, /admin (6-tab panel)

## Components
- PaywallModal, SessionFinderModal, AppLayout, BottomNav, DesktopSidebar

## Stripe Integration (from Base44)
- Monthly: $29/mo (7-day trial), Lifetime: $299 one-time
- Edge functions needed: create-checkout-session, stripe-webhook, cancel-subscription, grant-premium-access, verify-and-activate-subscription
- FOUNDER promo code for 100% discount
- Functions use Base44 SDK — need rewrite for Supabase when Cloud enabled

## Anti-patterns
- No pure white — use Cream (#F2EFE7)
- No sharp corners — min 8px radius
- No system fonts — Georgia/system-ui fallback only
- No exclamation points in copy
