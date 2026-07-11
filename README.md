# COVID-19 Tracker

Interactive global COVID-19 dashboard with MapLibre maps, KPI cards, charts, searchable country overview, and news.

**Live demo:** https://yomna-raouf.github.io/COVID19-Tracker/

## Quick start (local)

```bash
cp .env.example .env
# add your NEWS_API_KEY in .env

cd COVID-Tracker-Api
npm install
cd ..
npm start
```

Open [http://localhost:3000](http://localhost:3000).

Environment variables (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `PORT` | Local server port (default `3000`) |
| `NEWS_API_KEY` | NewsAPI key for `/api/news` (falls back to mock data if missing) |

## GitHub Pages

This project is static-hosting ready:

- Live COVID stats from [disease.sh](https://disease.sh) with local JSON fallbacks in `/data`
- News served from `/data/news.json`
- Map tiles from OpenFreeMap via MapLibre GL JS

Pushing to `master` deploys via GitHub Actions (`.github/workflows/deploy-pages.yml`).

## What it includes

- Worldwide + per-country KPIs
- Interactive map with metric toggles and country search
- Scrollable ranked overview table
- 120-day trend + composition charts
- Guidance section and COVID info modal
- Responsive layout for desktop and mobile

## Upwork portfolio copy

See `PORTFOLIO.md` for ready-to-paste Upwork project fields.
