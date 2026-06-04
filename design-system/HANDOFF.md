# Design Handoff — "Honey & Ink" UI

Answers to Antigravity's questions, plus everything it needs to match the mockup.

---

## 1. Styling library: **none — plain CSS, NOT Tailwind**

Do **not** install Tailwind. The whole design is plain CSS driven by **CSS custom
properties (variables)**. Just drop in one stylesheet and use semantic class names.

```js
// client/src/main.jsx (or App.jsx)
import './design-system.css';
```

(`design-system.css` is in this folder — copy it to `client/src/`.)

Load the two webfonts once in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&family=Heebo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

The app is **right-to-left**. Set it once on the root element:

```html
<html lang="he" dir="rtl">
```

---

## 2. Theming (this replaces any per-component color code)

Colors live in 3 themes + dark mode, switched by **data attributes on `<html>`** —
no JS color objects, no prop drilling:

```js
document.documentElement.dataset.theme   = 'honey'; // 'honey' | 'mist' | 'clay'  (default: mist)
document.documentElement.dataset.dark    = 'true';  // dark mode on
document.documentElement.dataset.density = 'compact'; // optional denser spacing
```

- **honey** — warm cream + amber + charcoal (the first direction)
- **mist** — cool sage + cornflower blue + slate (the default shown)
- **clay** — warm terracotta + dusty blue

Because everything reads from variables, switching a theme repaints the entire app.
A minimal theme switcher:

```jsx
const setTheme = (t) => { document.documentElement.dataset.theme = t; };
// <button onClick={() => setTheme('honey')}>דבש</button> ...
```

---

## 3. The components (React)

The mockup is built from a handful of class-based primitives. Rebuild them inside
**your** component architecture — same class names, your own JSX/state. Recipes:

### App shell + top pill-nav
```jsx
<div className="app" dir="rtl">
  <nav className="topnav">
    <div className="topnav-bar">
      <div className="brand-mark">
        <div className="brand-glyph">ה</div>
        <div className="brand-text"><b>הערכה</b><span>כלי הדרכה פדגוגית</span></div>
      </div>
      <div className="topnav-pills">
        <button className="topnav-pill active">הסטודנטים שלי <span className="pill-count">6</span></button>
        <button className="topnav-pill">ארכיון</button>
        <button className="topnav-pill">מחוונים</button>
      </div>
      <div className="topnav-actions">
        <button className="icon-btn">{/* settings icon */}</button>
        <button className="icon-btn dot">{/* bell icon */}</button>
        <div className="user-pill">
          <div className="avatar">ע</div>
          <div><div className="u-name">ענת</div><div className="u-role">מדריכה פדגוגית</div></div>
        </div>
      </div>
    </div>
  </nav>

  <main className="main">
    <div className="main-inner">{/* page content */}</div>
  </main>
</div>
```

### Buttons
```jsx
<button className="btn btn-primary">פעולה ראשית</button>   {/* charcoal/ink */}
<button className="btn btn-magic btn-lg">נתח את התיק</button> {/* accent fill */}
<button className="btn btn-secondary">משני</button>
<button className="btn btn-ghost btn-sm">רפאי</button>
```

### Card (floating, borderless)
```jsx
<div className="card card-hover">…</div>
<div className="card-dark">…</div>   {/* dark spotlight panel */}
```

### Badges & tags
```jsx
<span className="badge badge-warn">ממתין</span>
<span className="badge badge-ok">מוכן</span>
<span className="badge badge-info">בעבודה</span>
<span className="tag active">ראיה 1</span>
```

### Inputs
```jsx
<label className="label">כותרת</label>
<input className="input" />
<textarea className="textarea" />
```

---

## Design language (so new components stay consistent)

| Aspect | Rule |
|---|---|
| Radii | cards `22px`, inputs `16px`, buttons/badges/pills `100px` |
| Surfaces | borderless cards on `--surface`, separated by **soft shadows**, not borders |
| Primary action | charcoal/ink (`--ink-dark`), **not** the accent color |
| Accent | reserved for the one "hero" action + highlights/fills |
| Background | full-bleed radial gradient wash (`--wash-1/2/3`) |
| Type | Rubik (headings) + Heebo (body), both friendly geometric sans |
| Two data channels | lesson plans use `--lp*`, observations use `--ob*` (distinct hues) |
| Motion | entrance animations animate **transform only** — never rest at `opacity:0` |
| Direction | RTL; use logical CSS props (`margin-inline-*`, `inset-inline-*`) |

---

## Token reference (the contract)

`--ink-dark` dark panels/primary · `--on-dark` text on them · `--honey` accent fill ·
`--accent` accent text · `--brand-soft/-softer` tinted accent backgrounds ·
`--surface / -2 / -3` card surfaces · `--ink-1…4` text hierarchy ·
`--border / -strong` hairlines · `--ok/-soft --warn/-soft --info/-soft` status ·
`--lp* --ob*` the two data-channel colors · `--r-*` radii · `--gap-* --pad-card` spacing ·
`--shadow-1…3 --shadow-dark` elevation · `--fs-*` type scale.

---

## Suggested prompt for Antigravity

> Use `design-system.css` (plain CSS variables, **no Tailwind**) as the single source of
> styling. Import it once in `main.jsx`, add the Rubik+Heebo font links and `dir="rtl"` to
> `index.html`, and restyle my existing components using the class names and recipes in
> `HANDOFF.md` — keep all current logic/data flow, only change presentation. Wire a theme
> switcher that sets `document.documentElement.dataset.theme` to `honey` / `mist` / `clay`.
