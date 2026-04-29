# Velum Design Tokens — Source of Truth

These are the canonical color, font, and radius values used across the Velum brand.

**Two surfaces consume these:**

1. **App** (`src/index.css`) — uses HSL custom properties + Tailwind.
2. **Landing** (`public/landing/index.html`) — static HTML with a `:root` block of pre-converted hex values that mirror the app's HSL.

If you change a token in one place, **you must update it in the other**, and update the table below.

---

## Canonical palette

| Token              | App (`src/index.css` HSL) | Landing (`public/landing/index.html` hex) | Used for                     |
| ------------------ | ------------------------- | ----------------------------------------- | ---------------------------- |
| `--background`     | `156 40% 7%`              | `--bg: #0b1d15`                           | Page background              |
| `--card`           | `156 52% 14%`             | `--card: #112e22`                         | Card / panel background      |
| `--surface-light`  | `156 43% 18%`             | `--card2: #1a4233`                        | Lifted surface               |
| `--accent`         | `42 53% 54%`              | `--gold: #cfa441`                         | Gold accent (CTAs, dividers) |
| `--foreground`     | `40 24% 93%`              | `--cream: #efeae0`                        | Primary text                 |
| `--brand-green-deep` | `156 51% 12%`           | (use `--bg2: #081710` or `--card`)        | Deepest green for gradients  |

## Fonts

| Family                 | Use                                  |
| ---------------------- | ------------------------------------ |
| Cormorant Garamond     | Display, headings, italic emphasis   |
| DM Sans                | Body, UI labels                      |
| Lato                   | Landing page CTAs (legacy)           |

## Discipline rule

When updating colors:

1. Edit the HSL in `src/index.css` `:root`.
2. Convert each changed HSL to hex (any HSL→hex tool).
3. Edit the matching variable in `public/landing/index.html` `:root`.
4. Update the table in this file.
5. Commit all three together. PR title: `Tokens: …`.

If you find drift, treat fixing it like a bug — file an issue, fix in one PR.
