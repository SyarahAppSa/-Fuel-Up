# Fuel App website (Angular)

Bilingual corporate site for **Fuel App / فيول آب** (a Maisan Company brand). Arabic (RTL) at `/`, English (LTR) at `/en`.

- Angular 22, standalone components, signals, zoneless.
- **Static pre-rendering:** all 20 pages are generated as plain HTML at build time (10 pages × 2 languages). No server is needed: any static host works (Render static site today).
- Each page has its own title, description, canonical URL, hreflang alternates and share image.

## Commands

```bash
npm ci          # install exact dependency versions
npm start       # dev server at http://localhost:4200
npm run build   # production build → dist/fuelapp/browser
```

## Where things live

| What | Where |
|---|---|
| Page texts (Arabic / English) | `src/app/i18n/strings.ar.ts`, `strings.en.ts`. The same key holds the same text in both languages. |
| Lists and policies (services, clients, regions, operations room…) | `src/app/data/content.ar.ts`, `content.en.ts` |
| Messages inside forms, map and operations room | `src/app/i18n/ui.ts` |
| Pages | `src/app/pages/*.html` + `pages.ts` |
| Header, top bar, footer, WhatsApp button | `src/app/layout/` |
| Interactive parts | `src/app/features/`: slider, services tabs, coverage map, quote form (WhatsApp), operations room + 3D simulator |
| Global styles | `src/styles.css` (one stylesheet; right-to-left first, English overrides at the end) |
| Images, logos, icons, robots.txt, sitemap.xml, 404 page | `public/` |

## Contact form

The form never sends data to a server. It opens the visitor's WhatsApp with a ready-made message to **920009088** (`WA_NUMBER` in `src/app/features/quote-form.ts`). Nothing is delivered until the visitor presses «Send» in WhatsApp.

## Deploy

The site is built by Render on each push:

- Build command: `npm ci && npm run build`
- Publish directory: `dist/fuelapp/browser`
- Node: 22

Preview deployments send `X-Robots-Tag: noindex`. Remove that header only on the production service.
