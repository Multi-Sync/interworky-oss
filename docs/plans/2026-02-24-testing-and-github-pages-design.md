# Testing & GitHub Pages Design

**Date:** 2026-02-24
**Status:** Approved

## Goals

1. Add minimal smoke + core unit tests to verify the OSS platform works
2. Create a GitHub Pages landing page at interworky.com for the public launch

## Part 1: Testing Strategy

### Scope

~30 tests across 4 test files. No MongoDB or external services required.

### Test Files

| File | Purpose | ~Tests |
|------|---------|--------|
| `packages/providers/src/__tests__/registry.test.js` | Provider registry: register, get, cache, defaults, error paths | 8 |
| `packages/providers/src/__tests__/providers.test.js` | All 4 provider types resolve with console/default fallbacks | 8 |
| `packages/core/src/__tests__/plugins.test.js` | Plugin loader: auto-discovery, missing dir, bad plugins, route mounting | 6 |
| `packages/core/src/__tests__/app.test.js` | API smoke: root endpoint, 404 handler, CORS headers | 8 |

### Principles

- Mock MongoDB connections and Mongoose — no database needed
- No real AI/email/SMS calls — test provider pattern resolution only
- Use Jest (already configured in core)
- Add `test` step to CI pipeline

### CI Update

Add test step to `.github/workflows/ci.yml` after lint, before build.

## Part 2: GitHub Pages Landing Page

### Approach

Static HTML + TailwindCSS (CDN) in a `site/` directory at repo root. Zero build step required.

### Why Not Next.js / Astro / etc.?

- Dashboard already uses Next.js 15 — another framework adds complexity
- A landing page is a single HTML file — no build step, no dependencies
- Easy for contributors to modify
- Fast page load, zero JS framework overhead

### Page Sections

1. **Hero** — Title, tagline, CTA buttons (Get Started + GitHub)
2. **Features** — 3-column grid: Plugin System, BYO AI Provider, Admin Dashboard
3. **Architecture** — Visual diagram of packages and data flow
4. **Quickstart** — Terminal-style code blocks (Docker + Manual)
5. **AI Providers** — Grid of supported providers (OpenAI, Ollama, LM Studio, etc.)
6. **Footer** — License, GitHub link, Contributing link

### Design

- Dark theme (slate-900/950 background)
- Developer-focused aesthetic (Vercel/Supabase style)
- Monospace code blocks, terminal styling
- Responsive grid layout
- Minimal JS — just scroll animations

### Files

```
site/
  index.html    # Single-page landing
  CNAME         # Custom domain: interworky.com
  assets/
    favicon.ico
    og-image.png  (optional, for social sharing)
```

### Deployment

- GitHub Actions workflow: `.github/workflows/pages.yml`
- Triggers on push to `main` (path: `site/**`)
- Uses `actions/upload-pages-artifact` + `actions/deploy-pages`
- Custom domain via CNAME file

### Domain Setup

User will configure DNS for `interworky.com` to point to GitHub Pages:
- A records: 185.199.108-111.153
- Or CNAME to `<org>.github.io`
