# Interworky

Open-source AI assistant platform. Add voice and text AI chat, automatic bug detection, and smart analytics to any website.

## Architecture

```
interworky-oss/
  packages/
    core/          Express API server (MongoDB, auth, org management)
    assistant/     Embeddable widget (vanilla JS, WebRTC voice)
    ws-assistant/  WebSocket server (AI agents, tool execution)
    dashboard/     Next.js admin dashboard
    providers/     Pluggable service abstractions (AI, email, SMS, storage)
  plugins/         Domain-specific extensions (appointments, patients, etc.)
```

## Quickstart

### Option 1: Docker Compose

```bash
git clone https://github.com/Multi-Sync/interworky-oss.git
cd interworky-oss
cp .env.example .env
# Edit .env — at minimum set AI_API_KEY

docker-compose up
```

Services start at:
- Dashboard: http://localhost:31531
- Core API: http://localhost:3015
- WebSocket: ws://localhost:33355

### Option 2: Manual Setup

**Prerequisites:** Node.js 18+, MongoDB 6+

```bash
git clone https://github.com/Multi-Sync/interworky-oss.git
cd interworky-oss
cp .env.example .env
# Edit .env with your config

npm install
npm run dev
```

Turborepo starts all packages in parallel.

## Minimum Configuration

Only 4 environment variables are required:

```bash
MONGODB_URL=mongodb://localhost:27017/interworky
JWT_SECRET=change-me-to-a-random-string
AI_API_KEY=your-openai-or-compatible-api-key
AI_BASE_URL=https://api.openai.com/v1
```

Everything else has sensible defaults:
- **Email**: Logs to console (set `EMAIL_PROVIDER=sendgrid` or `smtp` for real email)
- **SMS**: Logs to console (set `SMS_PROVIDER=twilio` for real SMS)
- **Storage**: Local filesystem (set `STORAGE_PROVIDER=gcp` or `s3` for cloud)

## BYO AI Provider

Interworky works with any OpenAI-compatible API. Use Ollama, LM Studio, vLLM, Together AI, or any other provider:

```bash
# Ollama (local)
AI_API_KEY=ollama
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama3.1

# Together AI (cloud)
AI_API_KEY=your-key
AI_BASE_URL=https://api.together.xyz/v1
AI_MODEL=meta-llama/Llama-3.1-70B-Instruct-Turbo
```

Voice features require OpenAI's Realtime API. When using other providers, voice is automatically disabled and text chat continues to work.

See [docs/ai-providers.md](docs/ai-providers.md) for full provider setup guide.

## Plugins

Domain-specific features are packaged as plugins in the `plugins/` directory. The core server auto-discovers and mounts them at startup.

**Included plugins:** appointments, patients, reminders, post-visitations, testimonials, feedback, reviews, wix

**Creating a plugin:**

```
plugins/my-plugin/
  package.json    # name: "@interworky/plugin-my-plugin"
  index.js        # exports { name, router, models? }
  src/            # routes, controllers, models
```

```javascript
// plugins/my-plugin/index.js
const router = require('./src/routes');
module.exports = {
  name: 'my-plugin',   // mounted at /api/my-plugin
  router,
};
```

Plugins are optional. Remove any plugin directory to disable that feature.

## Project Structure

| Package | Port | Description |
|---------|------|-------------|
| `@interworky/core` | 3015 | REST API — auth, organizations, conversations, email |
| `@interworky/ws-assistant` | 33355 | WebSocket — AI agents, real-time tool execution |
| `@interworky/assistant` | — | Embeddable widget — text/voice chat for websites |
| `@interworky/dashboard` | 31531 | Admin UI — settings, analytics, agent configuration |
| `@interworky/providers` | — | Service abstractions — AI, email, SMS, storage |

## Documentation

- [AI Providers](docs/ai-providers.md) — Configure OpenAI, Ollama, LM Studio, and more
- [Contributing](CONTRIBUTING.md) — Development setup, plugin creation, PR process

## License

[Apache 2.0](LICENSE)
