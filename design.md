# SentinelGuard — showcase site · developer handoff

Static site. No build step, no framework, no npm. Open `index.html` and it runs.
Deploy target: GitHub Pages (push this folder's contents to the Pages branch/root).

```
handoff/
├── index.html            all markup, one section per top-level <div id="…">
├── css/styles.css        the only stylesheet — tokens at the top
├── js/main.js            all behaviour — SG_CONFIG at the top
└── assets/
    ├── screenshots/      5 dashboard states (supplied, final)
    ├── videos/           ← DROP THE 5 MP4s HERE
    │   └── posters/      still frames shown before play (placeholders supplied)
    ├── poster/           ← DROP sentinelguard-poster.pdf HERE
    ├── resumes/          ← DROP THE 2 RÉSUMÉ PDFs HERE
    └── team/             2 headshots (placeholders supplied)
```

---

## 1. What you must supply

| Path | What | Notes |
| --- | --- | --- |
| `assets/poster/sentinelguard-poster.pdf` | Capstone poster | Linked from nav (desktop + drawer) |
| `assets/videos/01-full-walkthrough.mp4` | ≈ 6 min | H.264 + AAC, 1080p, CRF 23–24 |
| `assets/videos/02-user-absent.mp4` | ≈ 2 min | |
| `assets/videos/03-observer.mp4` | ≈ 2 min | |
| `assets/videos/04-intruder.mp4` | ≈ 2 min | |
| `assets/videos/05-trusted-node-lost.mp4` | ≈ 2 min | |
| `assets/videos/posters/*.jpg` | 1280×720 still per clip | Placeholders are in place; replace with real frames |
| `assets/resumes/rivaldo-fonkou-resume.pdf` | | |
| `assets/resumes/hsuming-chien-resume.pdf` | | |
| `assets/team/rivaldo-fonkou.jpg` | 400×400, square | Placeholder in place |
| `assets/team/hsuming-chien.jpg` | 400×400, square | Placeholder in place |

Filenames are hard-coded in `index.html` — keep them exactly, or update the `src`/`href`.

**GitHub limits:** 100 MB per file, ~1 GB repo, ~100 GB/month Pages bandwidth. Five clips at the settings above land at roughly 5–15 MB each — comfortably inside. Do **not** use Git LFS: Pages serves the pointer file, not the video.

Recommended encode:
```
ffmpeg -i in.mov -c:v libx264 -crf 24 -preset slow -vf scale=-2:1080 \
       -c:a aac -b:a 128k -movflags +faststart out.mp4
```
`+faststart` matters — without it the browser must download the whole file before playing.

Poster frame from a clip:
```
ffmpeg -i out.mp4 -ss 00:00:03 -vframes 1 -q:v 3 posters/01-walkthrough.jpg
```

### Placeholders to replace in `index.html`
Search for `REPLACE`:
- two `mailto:REPLACE@example.com`
- two `https://www.linkedin.com/in/REPLACE`

---

## 2. Sections

Each is a top-level `<div>` with a stable `id`, in source order:

| id | Section | Notes |
| --- | --- | --- |
| `#nav` | Header | Sticky on desktop; a fixed floating bar + drawer ≤ 820px |
| `#hero` | Hero | Isometric laptop + node SVG, three animated pulse rings |
| `#overview` | Overview | Three sub-blocks: exposure cases, the three statuses, the collapsible architecture panel, then the screenshot rail |
| `#videos` | Demos | Five `<video>` rows, 8-col frame + 4-col copy |
| `#timeline` | Timeline | Five milestones on a 10-col grid (2 cols each) |
| `#team` | Team | Two 6-col member cards |
| `#footer` | Footer | Wordmark + back-to-top |
| `#feedback` | Floating feedback | Fixed button bottom-right + panel |
| `#gridOverlay` / `.grid-btn` | Design aid | 12-col + 8px baseline overlay. **Delete both before production if you don't want it shipped** (also drop section 14 of the CSS) |

Anchor links: `#overview`, `#videos`, `#timeline`, `#team`, `#hero`. `scroll-margin-top` is set so the sticky nav never covers a heading.

---

## 3. Design system

Everything is driven by the custom properties in section 1 of `styles.css`. Change a token, the whole page follows. Do not hard-code hexes or px values the tokens already carry.

**Grid** — 12 columns, 24px gutter, 1296px max width, 72px page margin (40px tablet, 20px phone). `.wrap` sets the measure, `.grid12` sets the columns. The timeline is its own 10-col grid so five milestones divide evenly.

**Colour**

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#07090f` | Page ground |
| `--bg-band` | `#0B1120` | Alternating full-width bands (hero, videos, team) |
| `--surface` | `#111827` | Cards |
| `--line` | `#1F2937` | Every 1px border |
| `--accent` | `#0EA5E9` | Single accent — lines, labels, outlines |
| `--ok` `--warn` `--observer` `--danger` | `#16A34A` `#E9B509` `#E77A24` `#E53E3E` | Status semantics; used consistently across cards, events and screenshots |

The accent is never used as a large fill — only as a 1–2px line, a label colour, or a 12–22% tint behind an outlined button.

**Type** — Inter, weights 300 / 500. Body 14/24 at weight 300. Headings weight 500 with negative tracking (`-.02em` to `-.035em`). Tracked-out uppercase labels (`.24em` for eyebrows, `.14–.18em` for smaller) carry all the hierarchy above headings — there is no bold anywhere.

**Rhythm** — 96px between major sections (56px on phone), 48px under a section heading, 24px inside cards.

**Buttons** are outlined, never filled. Hover lifts the border to `--line-strong` (neutral) or tints with `--accent-15` (accent). Focus is a 2px accent ring at 2px offset — set globally on `:focus-visible`, don't restyle per component.

---

## 4. Behaviour (`js/main.js`)

Six independent IIFEs, each safe if its DOM is missing:

1. **Scroll reveal** — `[data-reveal]` fades and rises once via `IntersectionObserver`. Hiding is applied only after JS runs (`html[data-reveal-on]`), and a 900ms failsafe shows everything if the observer never reports. Content is never stranded invisible with JS off.
2. **Nav drawer** — toggles `.is-open`, closes on link click, outside click, and Escape. The icon swaps via `aria-expanded` in CSS, no JS class juggling.
3. **Architecture panel** — toggles `.is-open` and flips the SHOW MORE / HIDE label and `+` / `−` caret.
4. **Screenshot rail** — arrows scroll by exactly one card + gutter so the CSS scroll-snap points stay aligned. Native touch/trackpad scrolling works unchanged.
5. **Feedback** — see below.
6. **Grid overlay** — dev aid.

`prefers-reduced-motion: reduce` kills the ring animation, the reveal transition and smooth scrolling.

### Feedback delivery

Set one of the two values at the top of `main.js`:

```js
var SG_CONFIG = {
  feedbackEndpoint: 'https://formspree.io/f/xxxxxxx', // preferred
  feedbackEmail:    'team@example.com'                // fallback
};
```

- **`feedbackEndpoint`** — any service that accepts a JSON `POST` (Formspree, Getform, Basin). Works on GitHub Pages with no backend of your own; the free tiers are ample for a showcase. Payload: `{impression, message, email, page}`.
- **`feedbackEmail`** — used only when the endpoint is empty. Opens the visitor's mail client pre-filled.
- Neither set → the panel shows "No delivery address configured yet." on submit.

Validation: a rating **or** a note is required; email is optional.

---

## 5. Responsive

Three breakpoints, all in section 16 of the CSS.

- **≤ 1080px (tablet)** — page margin 40px, `h1` drops to 48px, the hero art narrows.
- **≤ 820px (phone)** — page margin 20px, section rhythm 56px. Every `.grid12` and the timeline collapse to one column. The nav detaches into a fixed floating bar with a hamburger drawer (48px rows). Screenshot cards go one-per-view at 200px tall; arrows move inside the edges. The grid overlay button is hidden.
- **≤ 400px** — `h1` 30px, hero buttons go full width.

All hit targets are ≥ 44px. Minimum body text on phone is 13px; nothing shrinks below it.

---

## 6. Accessibility notes carried in the markup

- Toggles use `aria-expanded` / `aria-controls`; the rating chips use `aria-pressed`; the feedback panel is `role="dialog"` with `aria-hidden` kept in sync.
- Decorative SVG is `aria-hidden="true"`; the hero illustration has an `aria-label`.
- Every screenshot has a descriptive `alt`; every video has fallback text with a download link.
- The single global `:focus-visible` ring is intentional — don't remove it.
