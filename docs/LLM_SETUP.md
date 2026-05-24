# HealthMap Ghana — LLM setup

The AI assistant (patient triage + decision-maker analytics) uses an LLM to
turn structured results into a natural-language narrative. The LLM is
**optional**: if no provider is configured, the assistant automatically falls
back to deterministic rule-based answers, so the app always works.

You pick the backend with a single environment variable, `LLM_PROVIDER`.

| Provider | Value | Cost | Notes |
|---|---|---|---|
| **Google Gemini** | `gemini` | **Free tier** | Recommended. No billing needed. |
| Anthropic Claude | `claude` | Pay-as-you-go | Highest answer quality. |
| OpenAI (ChatGPT) | `openai` | Pay-as-you-go | `gpt-4o-mini` is cheap + fast. |
| Local Ollama | `ollama` | Free | Needs several GB of disk for the model. |
| Disabled | `none` | — | Rule-based answers only. |

No SDKs are required — the client uses the Python standard library only, so
there is nothing extra to `pip install`.

---

## Recommended: Google Gemini (free, no disk usage)

1. Go to <https://aistudio.google.com/app/apikey> and sign in with a Google
   account.
2. Click **Create API key** and copy it.
3. In your `.env` (copy from `.env.example` if you haven't):

   ```env
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your-key-here
   GEMINI_MODEL=gemini-2.0-flash
   ```

4. Restart the backend (`uvicorn app.main:app --reload`).

That's it. The patient and decision-maker assistants will now produce
LLM-written narratives. The free tier's rate limits are comfortably above
what a demo or competition judging session needs.

**Model options:** `gemini-2.0-flash` (default, fast, free), `gemini-2.0-flash`
(newer, also free), `gemini-1.5-pro` (higher quality, lower free quota).

---

## Anthropic Claude

```env
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-haiku-latest
```

Get a key at <https://console.anthropic.com/>. Use
`claude-3-5-sonnet-latest` for higher quality at a higher price.

## OpenAI (ChatGPT)

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Get a key at <https://platform.openai.com/api-keys>.

## Local Ollama (only if you have spare disk)

```env
LLM_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

Install from <https://ollama.com/>, then `ollama pull llama3.1:8b`. On a
small disk, `ollama pull qwen2.5:1.5b` (~1 GB) and set
`OLLAMA_MODEL=qwen2.5:1.5b`.

---

## Switching providers

Change `LLM_PROVIDER` in `.env`, make sure the matching key is filled in, and
restart the backend. No code changes needed.

## Turning the LLM off

Set `LLM_PROVIDER=none` (or `LLM_DISABLED=1`). The assistant returns its
rule-based triage and analytics narratives, which are fully functional on
their own.

---

## How fallback works

Every assistant response includes a `narrative_source` field:

- `"llm"` — the narrative was written by the configured model
  (the `llm_model` field names which one).
- `"rule_based"` — no LLM was available, so the deterministic engine produced
  the narrative. The patient triage logic, facility ranking, urgency
  classification, and all decision-maker analytics are computed **without**
  the LLM regardless, so accuracy never depends on model availability.

This means you can develop and demo offline, then flip on Gemini for the
polished narrative whenever you have a key configured.

## Security notes

- Never commit `.env` (it's git-ignored). Only `.env.example` is tracked.
- API keys are read from the environment at runtime; they are not written to
  any data file or log.
- The patient assistant's system prompt forbids it from surfacing any
  system-level / administrator data, and the decision-maker prompt forbids
  personal medical advice — the two roles stay strictly separated even when
  the same model serves both.
