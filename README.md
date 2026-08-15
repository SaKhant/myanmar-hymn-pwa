# Hymn House

A responsive Next.js hymn reader using the recovered Myanmar/English hymn and YP datasets.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Use `npm run build` for the production verification build.

## Data

The unchanged extracted source files live in `hymn_dataset/`. `lib/hymns/data.ts` is the server-only typed access layer; UI components receive normalized summaries or complete records from it. Original lyric lines and structured sections are rendered without rewriting.

Favorites, recently opened hymns, and lyric font size are stored in browser `localStorage`. The service worker caches visited pages and the main application shell for offline reuse. Audio remains network-only.
