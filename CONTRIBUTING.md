# Contributing to Interworky

## Development Setup

### Prerequisites

- Node.js 18+
- MongoDB 6+ (local or cloud)
- npm 9+

### Getting Started

```bash
git clone https://github.com/Multi-Sync/interworky-oss.git
cd interworky-oss

# Install all dependencies (Turborepo handles workspaces)
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your values (at minimum: MONGODB_URL, JWT_SECRET, AI_API_KEY)

# Start all packages in development mode
npm run dev
```

### Running Individual Packages

```bash
# Core API only
npm run dev --workspace=packages/core

# Dashboard only
npm run dev --workspace=packages/dashboard

# WS-Assistant only
npm run dev --workspace=packages/ws-assistant

# Build assistant widget
npm run build --workspace=packages/assistant
```

### Linting

```bash
# Lint all packages
npm run lint

# Lint a specific package
npm run lint --workspace=packages/core
```

## Architecture Overview

```
Request Flow:

Browser → Dashboard (Next.js :31531)
  └→ /api/* proxied to Core (:3015)

Website → Assistant Widget (embedded JS)
  ├→ Text: WebSocket → WS-Assistant (:33355) → AI Provider
  └→ Voice: WebRTC → OpenAI Realtime API (via session key from Core)

Core API (:3015)
  ├→ MongoDB (data)
  ├→ Providers (email, SMS, storage, AI)
  └→ Plugins (auto-loaded from plugins/)
```

### Key Design Decisions

- **Provider pattern**: All external services (AI, email, SMS, storage) are abstracted behind provider interfaces in `@interworky/providers`. Switch providers by setting an environment variable.
- **Plugin system**: Domain-specific features (appointments, patients, etc.) are extracted to `plugins/`. Core auto-discovers and mounts them. Remove a plugin directory to disable that feature.
- **Zero-config defaults**: Console email, console SMS, local filesystem storage. Works out of the box with just MongoDB and an AI key.
- **BYO AI**: Any OpenAI-compatible endpoint works. Set `AI_BASE_URL` to point at Ollama, LM Studio, vLLM, etc.

## Creating a Plugin

1. Create a directory under `plugins/`:

```
plugins/my-feature/
  package.json
  index.js
  src/
    my-feature.model.js
    my-feature.controllers.js
    my-feature.routes.js
```

2. `package.json`:

```json
{
  "name": "@interworky/plugin-my-feature",
  "version": "1.0.0",
  "main": "index.js"
}
```

3. `index.js` — must export `name` and `router`:

```javascript
const router = require('./src/my-feature.routes');

module.exports = {
  name: 'my-feature',    // Routes mounted at /api/my-feature
  router,
  models: { ... },       // Optional: export models for other plugins
};
```

4. The plugin is automatically loaded when Core starts. No changes to core code needed.

### Plugin Dependencies

Plugins can depend on other plugins or packages via workspace dependencies:

```json
{
  "dependencies": {
    "@interworky/providers": "*",
    "@interworky/plugin-appointments": "*"
  }
}
```

### Accessing Core Models from Plugins

Use Mongoose's model registry for core models (Organization, User, etc.):

```javascript
const Organization = require('mongoose').model('Organization');
```

For plugin models, use the plugin's exports:

```javascript
const { models: { Appointment } } = require('@interworky/plugin-appointments');
```

## Pull Request Process

1. Fork the repository and create a feature branch
2. Make your changes with clear, atomic commits
3. Ensure `npm run lint` passes
4. Ensure `npm run build` passes for affected packages
5. Write a clear PR description explaining the change
6. Link any related issues

### Commit Message Style

```
feat: add new feature
fix: resolve bug in X
refactor: restructure Y for clarity
docs: update Z documentation
chore: update dependencies
```

## Code Style

- JavaScript (not TypeScript) — the codebase uses CommonJS modules
- ESLint + Prettier for formatting
- Express routers for API endpoints
- Mongoose for MongoDB models
- React + Next.js for the dashboard (App Router)

## Getting Help

- Open an issue for bugs or feature requests
- Email hello@interworky.com for questions
