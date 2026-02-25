# Changelog

## 2026-02-24 — Testing & GitHub Pages

### Created
- `site/index.html` — Production-grade landing page for interworky.com (dark-themed, developer-focused, Tailwind CSS, responsive, SEO meta tags, scroll animations)
- `site/CNAME` — GitHub Pages custom domain configuration for interworky.com
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow (auto-deploys on push to main)
- `packages/providers/src/__tests__/registry.test.js` — 7 unit tests for the provider registry (register, retrieve, cache, clear, env selection, error handling)
- `packages/providers/src/__tests__/providers.test.js` — 7 integration tests for provider defaults (email, SMS, storage, AI resolution + functional behavior)
- `packages/providers/jest.config.js` — Jest configuration for providers package
- `packages/core/src/__tests__/plugins.test.js` — 6 unit tests for the plugin loader (empty dir, missing dir, valid plugin, missing name, missing router, crash on require)
- `packages/core/src/__tests__/app.test.js` — 6 API smoke tests (Hello World, 404, CORS headers, Helmet headers, JSON parsing, content-type)
- `packages/core/src/createApp.js` — Testable Express app factory (no DB connection or listen side effects)
- `packages/core/jest.config.js` — Jest configuration for core package
- `docs/plans/2026-02-24-testing-and-github-pages-design.md` — Design document
- `docs/plans/2026-02-24-testing-and-github-pages-plan.md` — Implementation plan

### Updated
- `.github/workflows/ci.yml` — Added test steps for providers and core packages
- `packages/providers/package.json` — Added Jest dependency and real test script
- `packages/ws-assistant/package.json` — Added `--passWithNoTests` flag
- `package.json` — Added `packageManager` field for Turbo compatibility

## 2026-02-24 — E2E Runtime Fixes

### Fixed
- Made cross-plugin model lookups lazy (getter functions) so plugins can load in any order
  - `plugins/appointments/src/appointment.controllers.js` — `mongoose.model('Patient')` → `getPatient()` lazy getter
  - `plugins/patients/src/patient.controllers.js` — `mongoose.model('Organization')` → `getOrganization()` lazy getter
  - `plugins/post-visitations/src/post_visitation.controllers.js` — same pattern for Organization + User
- Replaced 6 direct `new OpenAI()` calls with `getAIProvider().getClient()` provider pattern
  - `assistant_data.utils.js`, `assistant_data.controllers.js`, `assistant_info.utils.js`
  - `organization_methods.utils.js`, `flow_action.service.js`, `daily_briefing.service.js`
- Added `'not-configured'` fallback API key in `OpenAIProvider.js` so server starts without crashing
- Fixed `gcp.js` crash when `NODE_ENV` is undefined — added `|| 'development'` fallback
- Fixed syntax error in `invitation.service.js` line 68 (extra `}` from old SendGrid pattern)
- Added `.npmrc` with `legacy-peer-deps=true` for nodemailer peer dep conflict

### Updated
- Replaced remaining relative sibling-module imports in plugins with `mongoose.model()` lazy lookups (3 files, 6 imports)
  - `plugins/appointments/src/appointment.controllers.js` — `../patient/patient.model` -> `mongoose.model('Patient')`, `../organization/organization.model` -> `mongoose.model('Organization')`, `../user/user.model` -> `mongoose.model('User')`
  - `plugins/patients/src/patient.controllers.js` — `../organization/organization.model` -> `require('mongoose').model('Organization')`
  - `plugins/post-visitations/src/post_visitation.controllers.js` — `../organization/organization.model` -> `require('mongoose').model('Organization')`, `../user/user.model` -> `require('mongoose').model('User')`

## 2026-02-24

### Updated
- Fixed broken `require()` paths in all plugin source files (22 files across 7 plugins)
  - `plugins/appointments/src/` — appointment.model.js, appointment.controllers.js, appointment.routes.js, appointment.validators.js
  - `plugins/patients/src/` — patient.controllers.js, patient.routes.js, patient.validators.js
  - `plugins/feedback/src/` — negative_feedback.controllers.js, negative_feedback.routes.js, negative_feedback.validators.js
  - `plugins/testimonials/src/` — testimonial.controllers.js, testimonial.routes.js, testimonial.validators.js
  - `plugins/reminders/src/` — post_visitation_reminder.controllers.js, post_visitation_reminder.routes.js, post_visitation_reminder.validators.js
  - `plugins/reviews/src/` — social_media_review_reminder.controllers.js, social_media_review_reminder.routes.js, social_media_review_reminder.validators.js
  - `plugins/post-visitations/src/` — post_visitation.controllers.js, post_visitation.routes.js, post_visitation.validators.js
- Changed `../../utils/` to `../../../packages/core/src/utils/` and `../../middlewares/` to `../../../packages/core/src/middlewares/`

## 2026-02-24

### Created
- `README.md` — Project description, quickstart, architecture overview
- `CONTRIBUTING.md` — Dev setup, plugin creation guide, PR process
- `.github/workflows/ci.yml` — GitHub Actions CI (lint + build, Node 18/20, MongoDB)
- `docs/ai-providers.md` — Full guide for configuring AI providers (OpenAI, Ollama, LM Studio, vLLM, etc.)
- `packages/core/src/plugins.js` — Plugin auto-discovery and route mounting system
- 8 plugins extracted from core to `plugins/` directory:
  - `plugins/appointments/` — Appointment management
  - `plugins/patients/` — Patient management
  - `plugins/reminders/` — Post-visitation reminders
  - `plugins/post-visitations/` — Post-visitation records
  - `plugins/testimonials/` — Testimonial collection
  - `plugins/feedback/` — Negative feedback tracking
  - `plugins/reviews/` — Social media review reminders
  - `plugins/wix/` — Wix integration

### Deleted
- Billing system removed from core: `modules/plan/`, `modules/subscription/`, `modules/payment/`, `modules/checkout/`, `routers/stripe.router.js`
- Billing UI removed from dashboard: checkout pages, SubscriptionContext, TrialBanner, TrialExpiredBanner, FeatureLockedModal, BillingActionModal, BillingConfirmationModal, PricingPreviewSection
- Proprietary analytics removed from dashboard: HotjarAnalytics, reCAPTCHA route, Sentry configs, instrumentation.js
- Domain modules moved from core to plugins (see Created above)

### Updated
- `packages/core/src/app.js` — Loads plugins from `plugins/` directory, removed Stripe/Wix routes
- `packages/core/src/routers/index.router.js` — Removed all plugin-extracted routes (appointments, patients, reminders, testimonials, feedback, reviews, wix)
- `packages/core/src/modules/organization/organization.model.js` — Simplified onboarding enum: `['setup', 'plugin', 'complete']`
- `packages/core/src/modules/plugin_status/plugin_status.controllers.js` — Plugin verification marks onboarding complete (no checkout redirect)
- `packages/core/src/utils/slackCVP.js` — Silently skips when SLACK_WEBHOOK_URL not configured
- `packages/core/src/utils/gcp.js` — Uses storage provider abstraction
- `packages/core/src/routers/openai.router.js` — Uses AI provider with 503 fallback for non-OpenAI backends
- `packages/dashboard/next.config.mjs` — Removed `withSentryConfig` wrapping
- `packages/dashboard/src/app/layout.js` — Removed Hotjar import and DNS prefetch
- `packages/dashboard/src/app/global-error.jsx` — Replaced Sentry with console.error
- `packages/dashboard/package.json` — Removed @hotjar/browser, @sentry/nextjs, react-google-recaptcha-v3, @stripe/* deps
- `packages/providers/src/ai/OpenAIProvider.js` — Broadened realtime fallback error handling (405, ENOTFOUND)
- All dashboard pages with subscription gating now have features always enabled

## 2026-02-23

### Updated
- Replaced hardcoded model strings with environment variable fallbacks in all 21 agent files under `packages/ws-assistant/src/agents/`
  - `model: "gpt-4o"` -> `model: process.env.AI_MODEL || "gpt-4o"` in 15 files (plannerAgent, relevantFileFinderAgent, nextConfigAgent, testAgent, typeConfigAgent, personalizationGeneratorAgent, classifierAgent, fileStructureAgent, repoAnalysisAgent, mobileAgent, intentExtractorAgent, packageJsonAgent, repoAgent, carlaAgent, personalizationJudgeAgent)
  - `model: "gpt-4o-mini"` -> `model: process.env.AI_FAST_MODEL || "gpt-4o-mini"` in 4 files (fixApplierAgent, fixJudgeAgent, reviewerAgent, verifyAgent)
  - `const model = "gpt-4o"` -> `const model = process.env.AI_MODEL || "gpt-4o"` in 2 files (errorFixAgent, securityFixAgent)
