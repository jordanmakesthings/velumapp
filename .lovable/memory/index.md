Velum wellness app design system and architecture decisions.

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
- Mobile-first, max-w-2xl centered content
- Blueprint page removed — /blueprint redirects to /profile

## Anti-patterns
- No pure white — use Cream (#F2EFE7)
- No sharp corners — min 8px radius
- No system fonts — Georgia/system-ui fallback only
- No exclamation points in copy
- NEVER use "premium" language — users are trial, paid, or no access
- NEVER reference "blueprint" — feature removed
