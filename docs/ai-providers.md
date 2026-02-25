# AI Provider Configuration

Interworky uses a single, configurable AI provider that supports any OpenAI-compatible API endpoint. This means you can use OpenAI, Ollama, LM Studio, vLLM, Together AI, or any other service that implements the OpenAI Chat Completions API.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_API_KEY` | Yes | — | API key for the AI provider |
| `AI_BASE_URL` | No | `https://api.openai.com/v1` | Base URL for the API |
| `AI_MODEL` | No | `gpt-4o` | Default model for text chat |
| `AI_FAST_MODEL` | No | `gpt-4o-mini` | Lighter model for quick tasks (auto-fix, classification) |
| `AI_REALTIME_MODEL` | No | `gpt-4o-realtime-preview-2024-12-17` | Model for voice/realtime features |

## Tested Providers

| Provider | Text Chat | Tool Calling | Voice/Realtime | Setup Difficulty |
|----------|-----------|--------------|----------------|------------------|
| **OpenAI** | Yes | Yes | Yes | Easy — just set `AI_API_KEY` |
| **Ollama** | Yes | Partial* | No | Easy — local install |
| **LM Studio** | Yes | Partial* | No | Easy — local install |
| **vLLM** | Yes | Yes | No | Medium — requires GPU |
| **Together AI** | Yes | Yes | No | Easy — cloud API |
| **OpenRouter** | Yes | Yes | No | Easy — cloud API |
| **Azure OpenAI** | Yes | Yes | Yes** | Medium — Azure setup |
| **MiniMax** | Yes | Partial* | No | Easy — cloud API |

\* Tool calling support varies by model. Use models that support function calling for best results.
\** Azure OpenAI supports realtime if using the correct deployment.

## Provider Setup

### OpenAI (Default)

```bash
AI_API_KEY=sk-proj-your-key-here
# AI_BASE_URL is not needed — defaults to https://api.openai.com/v1
```

All features work including voice/realtime.

### Ollama (Local)

```bash
# Install: brew install ollama (macOS) or see https://ollama.com
# Pull a model: ollama pull llama3.1
# Start: ollama serve

AI_API_KEY=ollama
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama3.1
AI_FAST_MODEL=llama3.1
```

Voice features will be automatically disabled. Text chat and basic tool calling work with supported models.

### LM Studio (Local)

```bash
# Download from https://lmstudio.ai
# Load a model and start the local server

AI_API_KEY=lm-studio
AI_BASE_URL=http://localhost:1234/v1
AI_MODEL=your-loaded-model-name
AI_FAST_MODEL=your-loaded-model-name
```

Voice features will be automatically disabled.

### vLLM (Self-Hosted)

```bash
# Start vLLM with OpenAI-compatible API:
# python -m vllm.entrypoints.openai.api_server --model meta-llama/Llama-3.1-8B-Instruct

AI_API_KEY=token-abc123
AI_BASE_URL=http://localhost:8000/v1
AI_MODEL=meta-llama/Llama-3.1-8B-Instruct
AI_FAST_MODEL=meta-llama/Llama-3.1-8B-Instruct
```

### Together AI (Cloud)

```bash
AI_API_KEY=your-together-api-key
AI_BASE_URL=https://api.together.xyz/v1
AI_MODEL=meta-llama/Llama-3.1-70B-Instruct-Turbo
AI_FAST_MODEL=meta-llama/Llama-3.1-8B-Instruct-Turbo
```

### OpenRouter (Cloud)

```bash
AI_API_KEY=your-openrouter-key
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=anthropic/claude-sonnet-4
AI_FAST_MODEL=anthropic/claude-haiku-4
```

## Feature Compatibility

### Text Chat
Works with all providers. This is the core feature — the AI assistant chatting with website visitors via text.

### Tool Calling (Organization Methods)
Requires a model that supports function calling. Most modern models (GPT-4o, Claude, Llama 3.1+, Mixtral) support this. If your model doesn't support tool calling, the assistant will still work for conversation but won't be able to execute actions (booking appointments, sending emails, etc.).

### Voice / Realtime
**Requires OpenAI's Realtime API** (or a compatible implementation like Azure OpenAI). When using a provider that doesn't support realtime, the system automatically:
1. Returns a 503 from the session-key endpoint
2. Disables voice features in the widget
3. Text chat continues to work normally

There is no configuration needed — the fallback is automatic.

## Choosing a Model

For best results with Interworky's assistant features:

- **Tool calling is important**: The assistant uses tools to book appointments, manage data, and execute workflows. Choose models with strong function/tool calling support.
- **Instruction following**: The assistant relies on system prompts and instructions. Models with good instruction adherence work best.
- **Recommended for self-hosted**: `meta-llama/Llama-3.1-70B-Instruct` or `Qwen/Qwen2.5-72B-Instruct` for best quality; `Llama-3.1-8B-Instruct` for lower resource usage.

## Troubleshooting

**"Realtime sessions not available"**: Expected when using non-OpenAI providers. Text chat still works.

**Empty or garbled responses**: Check that `AI_MODEL` matches an actual model name on your provider. Run `ollama list` for Ollama or check your provider's model catalog.

**Tool calls not working**: Ensure your model supports function calling. Try a larger model or switch to a provider with better tool support.

**Connection refused**: Verify your AI provider is running and `AI_BASE_URL` is correct. For local providers, ensure the server is started before Interworky.
