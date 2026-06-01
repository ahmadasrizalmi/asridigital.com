# ASRI Digital — Design System (Ethereal)

Standar visual untuk seluruh website asridigital.com dan email templates.

## Filosofi

Desain "Ethereal" — clean, minimal, soft shadows, radial gradient accent. Terinspirasi dari Notion/Linear aesthetic. Bukan bold/grunge, bukan AI slop.

## Warna

| Token | Hex | Kegunaan |
|-------|-----|----------|
| `carbon` | `#0f172a` | Headings, strong text (slate-900) |
| `text-main` | `#475569` | Body text (slate-600) |
| `text-secondary` | `#64748b` | Secondary text (slate-500) |
| `text-muted` | `#94a3b8` | Captions, muted (slate-400) |
| `background` | `#f1f5f9` | Page background (slate-100) |
| `surface` | `#ffffff` | Card/surface |
| `border` | `#e2e8f0` | Borders (slate-200) |
| `border-light` | `#f1f5f9` | Subtle dividers (slate-100) |
| `primary` | `#10b981` | Accent, links, success (emerald-500) |
| `mint` | `#81E2A4` | Button gradient start |
| `cream` | `#F8F5C4` | Button gradient end |

## Gradient

**Ethereal background** (header, hero, email header):
```css
background-color: #f8fafc;
background-image:
  radial-gradient(circle at 80% 0%, rgba(167,243,208,0.4) 0%, transparent 50%),
  radial-gradient(circle at 10% 100%, rgba(186,230,253,0.4) 0%, transparent 50%);
```

**Button gradient** (CTA, pill buttons):
```css
background: linear-gradient(90deg, #81E2A4 0%, #F8F5C4 100%);
color: #1e293b; /* dark text */
```

## Shadow

| Token | Value | Kegunaan |
|-------|-------|----------|
| `soft` | `0 2px 10px -2px rgba(0,0,0,0.03)` | Subtle lift |
| `float` | `0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)` | Card hover |
| `card` | `0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05)` | Cards, panels |
| `card-hover` | `0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.02)` | Card hover state |
| `btn-primary` | `0 6px 20px rgba(129,226,164,0.25), 0 2px 4px rgba(0,0,0,0.05)` | Primary button |

## Typography

- **Font:** Plus Jakarta Sans (brand exception)
- **Headings:** `#0f172a` (slate-900), weight 700-800
- **Body:** `#475569` (slate-600), weight 400, line-height 1.7
- **Caption:** `#94a3b8` (slate-400), 13-14px

## Border Radius

| Token | Value | Kegunaan |
|-------|-------|----------|
| `rounded-lg` | `0.5rem` | Input, small elements |
| `rounded-xl` | `0.75rem` | Buttons (non-pill) |
| `rounded-2xl` | `1rem` | Cards |
| `rounded-4xl` | `1.25rem` | Large cards, email container |
| `rounded-full` | `9999px` | Pill buttons, badges |

## Button

**Primary (pill):**
```html
<a class="btn-primary" href="...">Label</a>
```
- Gradient mint→cream, dark text, pill shape, mint shadow

**Secondary:**
```html
<button class="btn-secondary">Label</button>
```
- Solid `#0f172a`, white text, rounded-xl

**Tertiary:**
```html
<button class="btn-tertiary">Label</button>
```
- White bg, border, card shadow

## Cards

```html
<div class="card">...</div>
<div class="card-hover">...</div>  <!-- with hover lift -->
```
- White bg, `border-slate-200`, `rounded-2xl`, card shadow
- Hover: `card-hover` shadow + `translateY(-4px)`

## Email Templates

Email templates di `functions/api/[[route]].ts` menggunakan `BRAND` object yang sama dengan design tokens ini. Semua email konsisten via shared `emailLayout()`, `emailButton()`, `emailCard()`.

Header email pakai logo dari Cloudinary + ethereal gradient bg.
