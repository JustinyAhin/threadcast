# Threadcast Design Guidelines

Dark-mode-only, warm-toned interface shared across web (SvelteKit + Tailwind) and CLI (OpenTUI/Solid).

---

## Color Palette

### Core Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#0c0a09` | Page/app background |
| `surface-1` | `#161412` | Cards, panels |
| `surface-2` | `#1e1b18` | Hover states, inputs, selection bg |
| `border` | `#2e2a26` | Borders, dividers |
| `border-light` | `#3d3731` | Focus/active borders |
| `text` | `#ece8e1` | Primary text |
| `text-secondary` | `#a8a29e` | Descriptions, labels |
| `text-muted` | `#78716c` | Metadata, timestamps |
| `text-faint` | `#57534e` | Hints, quaternary (CLI only) |
| `accent` | `#f59e0b` | Primary accent (amber-500) — buttons, links, highlights |
| `accent-dim` | `#b45309` | Subtle accent — borders, secondary emphasis |
| `error` | `#ef4444` | Error states |
| `success` | `#22c55e` | Success states |

### Semantic Message Colors (Web)

| Context | Background | Border |
|---------|------------|--------|
| User message | `#0c1a24` (cyan tint) | `cyan-600/40` |
| Assistant message | `#161412` (surface-1) | `accent-dim/40` |
| Tool call block | `#12100e` | `#2e2a26` |

### Tool Badge Colors (Web)

Each tool gets a distinct color at `500/15` bg + `400` text:

| Tool | Color |
|------|-------|
| Bash | emerald |
| Read | sky |
| Edit | amber |
| Write | orange |
| Grep | violet |
| Glob | teal |
| WebFetch / WebSearch | cyan |
| Task | rose |

---

## Typography

### Fonts

| Font | Family | Usage |
|------|--------|-------|
| Sans | Bricolage Grotesque (400, 500, 600, 700) | Headings, body text |
| Mono | JetBrains Mono (400, 500) | Code, timestamps, metadata, IDs |

### Hierarchy (Web)

| Level | Classes |
|-------|---------|
| H1 | `text-2xl font-bold` |
| H2 | `text-xl font-semibold` |
| H3 | `text-lg font-semibold` |
| Body | `text-text` |
| Secondary | `text-text-secondary` |
| Muted | `text-text-muted` |
| Inline code | `font-mono text-xs bg-surface-2 text-accent` |

### Hierarchy (CLI)

Bold (`<b>`) is the only emphasis. No italic.

| Level | Style |
|-------|-------|
| Title | `accent` + bold |
| Label | `textDim` + bold |
| Body | `text` |
| Secondary | `textMuted` |
| Dim | `textDim` |
| Hint | `textFaint` |

---

## Spacing

### Web

| Context | Value |
|---------|-------|
| Card padding | `p-5` |
| Compact padding | `p-3` |
| Container gutters | `px-6 py-4` |
| Section spacing | `mb-8` |
| Intra-group gap | `gap-3` (standard), `gap-2` (compact) |
| Max content width | `max-w-7xl` |
| Content column | `max-w-4xl` |
| Right sidebar | `w-72` |

### CLI

| Context | Value |
|---------|-------|
| Horizontal padding | `paddingX={1}` |
| Indentation | `paddingLeft={3}` |
| Status bar height | `height={1}` |
| Spacer | `height={1}` |
| Containers | `flexGrow={1}` |

---

## Components

### Cards (Web)

```
rounded-lg border border-border bg-surface-1 p-5
```

Hover: `hover-glow` class — amber box-shadow + lighter border.

### Buttons (Web)

- **Primary**: `bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90`
- **Icon/Secondary**: `rounded p-1 text-text-muted hover:bg-surface-2 hover:text-text`

Always add `cursor-pointer`.

### Messages (Web)

Layout: `flex gap-3` — avatar + content.

- **Avatar**: `h-7 w-7 rounded-full` with semantic bg/text color, `text-xs font-semibold` label
- **Message body**: `rounded-lg border-l-2 px-5 py-4` with contextual background

### Inputs (Web)

```
rounded-lg border border-border bg-surface-1 py-2 px-3 font-mono text-sm text-text
placeholder-text-muted focus:border-border-light focus:outline-none
```

### Search Bar (Web)

Sticky at top: `sticky top-0 z-10 backdrop-blur-md` with semi-transparent `bg` at 85% opacity.

### Borders (CLI)

`borderStyle="rounded"` with `colors.border`. Applied to main containers and dialogs.

### Selection (CLI)

Selected items get: `backgroundColor={colors.bgSelected}` + `pointer` symbol in `accent` + primary text color.

---

## Icons

### Web

All inline SVGs. Standard sizes: `h-4 w-4` (default), `h-3.5 w-3.5` (small), `h-6 w-6` (large). Inherit color from parent via `currentColor`.

### CLI

Unicode symbols defined in `theme.ts`:

| Symbol | Glyph | Usage |
|--------|-------|-------|
| pointer | `▸` | Selection indicator |
| dot | `●` | Loading/status |
| check | `✔` | Success |
| cross | `✘` | Error |
| ellipsis | `…` | Truncation |
| divider | `│` | Vertical separator |
| messages | `◈` | Message count |
| clock | `◗` | Timestamps |
| folder | `▪` | Project |
| share | `↗` | Share action |
| search | `⌕` | Search |

Always prefix status text with the appropriate symbol.

---

## Animation (Web)

| Name | Duration | Effect |
|------|----------|--------|
| `fade-in` | 0.4s | Opacity 0 → 1 |
| `slide-up` | 0.4s | +12px Y → 0 |
| `slide-in-left` | 0.4s | -12px X → 0 |
| `expand` | 0.3s | max-height 0 → 2000px |

Stagger with `--delay` CSS variable. Hover transitions: `0.2s ease` on box-shadow and border-color.

---

## Responsive (Web)

- Right sidebar: visible at `lg:` (hidden below)
- Left nav: visible at `xl:` (hidden below)
- Content fills width on smaller screens
- Truncate overflowing text: `line-clamp-2`, `truncate`

---

## Prose / Markdown (Web)

| Element | Key styles |
|---------|------------|
| Inline code | `bg-surface-2 text-accent font-mono` |
| Code block | `bg-tool-bg border border-tool-border rounded-lg p-4` |
| Link | `text-accent underline underline-offset-2` |
| Blockquote | `border-left: 3px accent-dim`, `text-text-secondary` |
| Table header | `bg-surface-2 font-semibold` |
| Line height | `1.7` for prose |

---

## Special Effects (Web)

- **Noise overlay**: Fixed SVG noise at 3% opacity over entire page (`z-9999`, `pointer-events: none`)
- **Hover glow**: `box-shadow: 0 0 20px rgba(245, 158, 11, 0.08)` on card hover
- **Search highlight**: `rgba(245, 158, 11, 0.25)` background
- **Dark date inputs**: `color-scheme: dark`

---

## Keyboard Conventions (CLI)

| Action | Keys |
|--------|------|
| Navigate | `j`/`k` or arrows |
| Open/Execute | `Enter` |
| Share | `s` |
| Filter/Search | `/` |
| Back/Cancel | `Esc` |
| Quit | `q` |

Status bar shows context-sensitive keyboard hints: bold key in `textMuted`, colon separator in `textFaint`.

---

## Design Principles

1. **Dark-only** — no light theme, warm stone/amber tones
2. **Monospace for data** — timestamps, IDs, code, metadata always in JetBrains Mono
3. **Semantic color coding** — each tool/message type has a consistent color
4. **Minimal motion** — short durations (0.2–0.4s), no gratuitous animation
5. **Progressive disclosure** — sidebars hide on smaller screens, tool calls collapse by default
6. **Symbols before text** — CLI status messages always prefixed with a unicode symbol
7. **Use tokens, not raw values** — always reference theme colors, never hardcode hex
