# DESIGN.md — Fluence-Adapted
---

## Surface Mode Override

Fluence is **dark-first**. The canvas flips from cream to near-black.

| Original token | Original value | Fluence override |
|---|---|---|
| `colors.canvas` | #faf9f5 (warm cream) | `#09090b` (near-black) |
| `colors.surface-soft` | #f5f0e8 | `#111113` |
| `colors.surface-card` | #efe9de | `#18181b` |
| `colors.surface-dark` | #181715 | `#0d0d0f` (deepest dark — footer/nav) |
| `colors.surface-dark-elevated` | #252320 | `#27272a` |
| `colors.surface-dark-soft` | #1f1e1b | `#1c1c1f` |
| `colors.ink` | #141413 | `#fafafa` (text inverts on dark bg) |
| `colors.body-strong` | #252523 | `#e4e4e7` |
| `colors.body` | #3d3d3a | `#a1a1aa` |
| `colors.muted` | #6c6a64 | `#71717a` |
| `colors.muted-soft` | #8e8b82 | `#52525b` |
| `colors.hairline` | #e6dfd8 | `#27272a` |
| `colors.hairline-soft` | #ebe6df | `#18181b` |
| `colors.on-dark` | #faf9f5 | `#fafafa` |
| `colors.on-dark-soft` | #a09d96 | `#a1a1aa` |

All other color tokens (primary coral, accents, semantic) **stay unchanged.**

---

## Accent Override

Fluence uses electric blue/purple instead of warm coral. Two paths:

**Path A — Keep coral (brand stays SandFin):**
No changes. Coral CTAs on dark bg read as warm/distinctive. Works.

**Path B — Add Fluence blue layer (if matching Fluence exactly):**
```yaml
colors:
  fluence-accent: "#6366f1"          # Electric indigo — Fluence signature
  fluence-accent-active: "#4f46e5"
  fluence-accent-glow: "rgba(99,102,241,0.15)"  # Glow ring on dark
  fluence-accent-soft: "rgba(99,102,241,0.08)"  # Subtle tint on card hover
```

Recommendation: **Path A**. Coral on near-black reads as more distinctive
than copying Fluence's blue-purple exactly. Reserve `fluence-accent` only
for ambient glows/decorative use.

---

## Typography Override

Fluence uses a clean geometric/grotesque sans throughout — no serif display.
Drop the serif for Fluence alignment.

```yaml
typography:
  display-xl:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: 64px
    fontWeight: 700          # ← bold (Fluence is bolder than Claude.com)
    lineHeight: 1.05
    letterSpacing: -2px      # Tighter on dark — more impact
  display-lg:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -1.5px
  display-md:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -1px
  display-sm:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.5px
  # title-* / body-* / caption-* / code / button / nav-link — unchanged
```

---

## Elevation & Depth Override

Fluence relies on **glassmorphism + glow** instead of color-block surfaces.

```yaml
elevation:
  glass-card:
    background: "rgba(255,255,255,0.04)"
    border: "1px solid rgba(255,255,255,0.08)"
    backdropFilter: "blur(12px)"
    borderRadius: "{rounded.xl}"   # 16px — Fluence cards are more rounded

  glass-card-hover:
    background: "rgba(255,255,255,0.07)"
    border: "1px solid rgba(255,255,255,0.12)"

  glow-primary:
    boxShadow: "0 0 40px rgba(204,120,92,0.20)"   # Coral glow (SandFin)
    # or swap for: "0 0 40px rgba(99,102,241,0.20)" if using fluence-accent

  glow-subtle:
    boxShadow: "0 0 20px rgba(255,255,255,0.04)"

  # Remove: Soft hairline (too light for dark bg — use glass-card border instead)
```

---

## Component Overrides

### top-nav
```yaml
top-nav:
  backgroundColor: "rgba(9,9,11,0.80)"   # Dark glass nav — Fluence pattern
  backdropFilter: "blur(16px)"
  borderBottom: "1px solid rgba(255,255,255,0.06)"
  textColor: "{colors.on-dark}"
  # Remove: cream background
```

### feature-card → glass-feature-card
```yaml
feature-card:
  backgroundColor: "rgba(255,255,255,0.04)"
  border: "1px solid rgba(255,255,255,0.08)"
  backdropFilter: "blur(8px)"
  textColor: "{colors.on-dark}"
  rounded: "{rounded.xl}"     # 16px — softer than original 12px
  padding: 32px
  # Icon at top gets coral (#cc785c) fill — the one warm pop on dark
```

### hero-band
```yaml
hero-band:
  backgroundColor: "{colors.canvas}"   # = #09090b after override
  # Ambient gradient behind hero text:
  backgroundDecoration: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(204,120,92,0.12), transparent)"
  textColor: "{colors.on-dark}"
```

### button-primary (unchanged tokens, new feel on dark bg)
Coral button on near-black already reads as Fluence-style glow CTA.
Add glow ring on hover:
```yaml
button-primary:
  # add:
  boxShadow: "0 0 0 0 rgba(204,120,92,0)"
  boxShadow-hover: "0 0 24px rgba(204,120,92,0.35)"
```

### button-secondary → glass button
```yaml
button-secondary:
  backgroundColor: "rgba(255,255,255,0.06)"
  border: "1px solid rgba(255,255,255,0.10)"
  textColor: "{colors.on-dark}"
  rounded: "{rounded.md}"
  # Remove: cream background
```

### pricing-tier-card
```yaml
pricing-tier-card:
  backgroundColor: "rgba(255,255,255,0.04)"
  border: "1px solid rgba(255,255,255,0.08)"
  textColor: "{colors.on-dark}"
  rounded: "{rounded.xl}"
  padding: 32px

pricing-tier-card-featured:
  backgroundColor: "{colors.primary}"        # Coral fill = Fluence "popular" highlight
  border: "none"
  textColor: "{colors.on-primary}"
  rounded: "{rounded.xl}"
  # Add glow: boxShadow "0 0 40px rgba(204,120,92,0.30)"
```

### footer (minimal change — already dark)
```yaml
footer:
  backgroundColor: "#050507"             # Deeper than canvas
  borderTop: "1px solid rgba(255,255,255,0.06)"
  textColor: "{colors.on-dark-soft}"
```

### badge-pill
```yaml
badge-pill:
  backgroundColor: "rgba(255,255,255,0.08)"
  border: "1px solid rgba(255,255,255,0.12)"
  textColor: "{colors.on-dark}"
  # Remove cream bg
```

---

## New: Glow Decoration Tokens

Fluence uses large ambient background glows. Add as design tokens:

```yaml
decoration:
  hero-glow-primary:
    # Radial behind h1 — coral smoke
    css: "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(204,120,92,0.15), transparent 70%)"

  hero-glow-secondary:
    # Optional — indigo counterpoise (Fluence-like)
    css: "radial-gradient(ellipse 40% 30% at 80% 50%, rgba(99,102,241,0.08), transparent 70%)"

  grid-overlay:
    # Subtle dot/line grid on dark bg — Fluence signature texture
    css: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)"
    backgroundSize: "24px 24px"
```

---

## What Does NOT Change

| Token group | Reason |
|---|---|
| `colors.primary` coral (#cc785c) | Keep — warm CTA on dark is distinctive |
| `colors.accent-teal`, `accent-amber` | Keep — usable as feature icon fills |
| `colors.success/warning/error` | Keep — semantic meaning unchanged |
| `spacing.*` | Keep — same rhythm works on dark |
| `rounded.*` | Keep (xl gets more use now) |
| `typography.body-*` / `caption-*` | Keep — only display weights changed |
| `typography.code` — JetBrains Mono | Keep — code blocks on dark = perfect |
| OPERA semantic aliases | Keep — OPERA session flow stays cream (warm bg = low cognitive load — still correct) |

---

## OPERA Exception

> **OPERA session screens DO NOT adopt Fluence dark mode.**

The rationale in the original DESIGN.md holds: dark surfaces increase cognitive load.
OPERA Dump → Profiler → Council → Verdict stays on the **original warm cream surfaces**
(`surface-soft`, `surface-card`, `canvas`). Only the marketing/landing shell goes dark.

This creates a deliberate transition: dark marketing shell → warm cream app interior.
That contrast can itself be a brand signal: "the tool is calm; the world outside it is not."

---

## Fluence Structure Mapping

Fluence sections → your tokens:

| Fluence section | Component token to use |
|---|---|
| Dark glass nav | `top-nav` (override above) |
| Hero (dark bg + glow + h1) | `hero-band` (override above) |
| Feature bento grid | `feature-card` (glass override) |
| "About" marquee band | `cta-band-dark` — keep as-is |
| Testimonial cards | `feature-card` (glass) |
| Pricing 3-up | `pricing-tier-card` (glass) + `pricing-tier-card-featured` (coral) |
| FAQ accordion | new: `faq-row` — glass card, hairline dividers |
| CTA band pre-footer | `callout-card-coral` — coral bg reads great on dark page |
| Footer | `footer` (deepen bg) |

---

## Do's and Don'ts (Fluence Edition)

### Do
- Anchor page on `#09090b` near-black, not pure `#000000` (too harsh).
- Use coral CTAs with glow ring — the warm pop on dark is the brand differentiator.
- Use glassmorphism (`rgba(255,255,255,0.04)` + blur) for cards — Fluence's defining texture.
- Add ambient radial glow behind hero h1 (coral smoke, low opacity).
- Keep Inter/Manrope bold (600-700) for display — lightweight serif reads poorly on dark.
- Use `{rounded.xl}` (16px) more liberally — Fluence cards are softer-cornered.

### Don't
- Don't use pure white text — `{colors.on-dark}` (#fafafa) only.
- Don't use cream canvas for marketing screens (only OPERA interior).
- Don't add colored drop shadows on glassmorphism cards — use glow only on interactive/CTA elements.
- Don't over-glow — one glow per viewport max (usually behind hero or on featured pricing card).
- Don't use the Copernicus/Tiempos serif for display — goes dark-editorial, not modern SaaS.
- Don't put coral backgrounds on feature cards — glass cards only; coral = CTA/featured-tier.
