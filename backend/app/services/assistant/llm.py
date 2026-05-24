"""LLM client — provider-agnostic, with graceful no-LLM fallback.

One environment variable, LLM_PROVIDER, selects the backend:

    LLM_PROVIDER=gemini   (default)  -> Google Gemini  (free tier available)
    LLM_PROVIDER=claude              -> Anthropic Claude
    LLM_PROVIDER=openai              -> OpenAI (ChatGPT)
    LLM_PROVIDER=ollama              -> local Ollama install
    LLM_PROVIDER=none                -> disable LLM, rule-based answers only

Each provider reads its own key/model from the environment:

    Gemini  GEMINI_API_KEY      GEMINI_MODEL   (default gemini-2.0-flash)
    Claude  ANTHROPIC_API_KEY   CLAUDE_MODEL   (default claude-3-5-haiku-latest)
    OpenAI  OPENAI_API_KEY      OPENAI_MODEL   (default gpt-4o-mini)
    Ollama  OLLAMA_HOST         OLLAMA_MODEL   (default llama3.1:8b)

Shared:
    LLM_TIMEOUT     request timeout in seconds (default 45)
    LLM_DISABLED=1  force rule-based only (OLLAMA_DISABLED still honoured)

The client never blocks the platform: if no key is configured, the provider
is unreachable, or a request fails, chat() returns None and the assistant
falls back to its deterministic rule-based narrative.

Gemini self-healing: if the configured model is rejected because it is unknown
(HTTP 404) OR has no quota for this key (HTTP 429 with free-tier limit 0), the
client lists the models the key supports and retries with the next preferred
one. If none work, it stops trying for the rest of the process so it never
storms the API.

Implemented with the standard library only (urllib) — no SDKs to install,
which keeps the deployment footprint tiny.
"""
from __future__ import annotations
import json, os, urllib.request, urllib.error
from typing import Optional, List, Set


# Default model per provider (override with the matching *_MODEL env var)
_DEFAULT_MODELS = {
    "gemini": "gemini-2.0-flash",
    "claude": "claude-3-5-haiku-latest",
    "openai": "gpt-4o-mini",
    "ollama": "llama3.1:8b",
}

# Preference order when we have to auto-pick a Gemini model. -lite variants are
# included because they frequently carry separate (and larger) free quota.
_PREFERRED_GEMINI = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-001",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
]


class LLMClient:
    def __init__(self):
        self.provider = os.environ.get("LLM_PROVIDER", "gemini").strip().lower()

        # Back-compat: the old build only knew Ollama. If someone still sets
        # OLLAMA_DISABLED, honour it. LLM_DISABLED is the new generic switch.
        disabled = (
            os.environ.get("LLM_DISABLED", "").lower() in ("1", "true", "yes")
            or os.environ.get("OLLAMA_DISABLED", "").lower() in ("1", "true", "yes")
            or self.provider in ("none", "off", "disabled", "")
        )
        self.disabled = disabled
        self.timeout  = int(os.environ.get("LLM_TIMEOUT", "45"))

        # Provider-specific config
        self.gemini_key    = os.environ.get("GEMINI_API_KEY", "").strip()
        self.anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
        self.openai_key    = os.environ.get("OPENAI_API_KEY", "").strip()
        self.ollama_host   = os.environ.get("OLLAMA_HOST", "http://localhost:11434").rstrip("/")

        # Resolve the active model name (used for reporting via `.model`)
        env_model = {
            "gemini": "GEMINI_MODEL",
            "claude": "CLAUDE_MODEL",
            "openai": "OPENAI_MODEL",
            "ollama": "OLLAMA_MODEL",
        }.get(self.provider)
        self.model = (
            os.environ.get(env_model, "").strip() if env_model else ""
        ) or _DEFAULT_MODELS.get(self.provider, "")

        self._available: Optional[bool] = None

    # ------------------------------------------------------------------ #
    # Introspection helpers (used by check_llm.py)
    # ------------------------------------------------------------------ #
    def active_key(self) -> str:
        return {
            "gemini": self.gemini_key,
            "claude": self.anthropic_key,
            "openai": self.openai_key,
        }.get(self.provider, "")

    def list_gemini_models(self) -> List[str]:
        """Return Gemini model ids (for this key) that support generateContent."""
        url = (f"https://generativelanguage.googleapis.com/v1beta/models"
               f"?key={self.gemini_key}&pageSize=200")
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=self.timeout) as r:
            data = json.loads(r.read())
        out = []
        for m in data.get("models", []):
            methods = m.get("supportedGenerationMethods") or []
            if "generateContent" in methods:
                out.append((m.get("name") or "").replace("models/", ""))
        return out

    def _resolve_gemini_model(self, exclude: Optional[Set[str]] = None) -> Optional[str]:
        """Pick a working Gemini model the key supports, skipping `exclude`."""
        exclude = exclude or set()
        try:
            available = self.list_gemini_models()
        except Exception as e:
            print(f"[llm:gemini] could not list models: {e}")
            return None
        avail = [m for m in available if m not in exclude]
        if not avail:
            return None
        for pref in _PREFERRED_GEMINI:
            if pref in avail:
                return pref
        # else first plain "flash" text model (avoid image/tts/embedding)
        for a in avail:
            if "flash" in a and not any(x in a for x in ("image", "tts", "embed")):
                return a
        return avail[0]

    # ------------------------------------------------------------------ #
    # Liveness
    # ------------------------------------------------------------------ #
    def is_available(self) -> bool:
        """Cheap readiness check, cached per process.

        Cloud providers: 'available' means a key is configured. We don't burn
        an API call just to probe — if the real request fails, chat() degrades
        to rule-based. Ollama: ping the local daemon.
        """
        if self.disabled:
            return False
        if self._available is not None:
            return self._available

        if self.provider == "gemini":
            self._available = bool(self.gemini_key)
        elif self.provider == "claude":
            self._available = bool(self.anthropic_key)
        elif self.provider == "openai":
            self._available = bool(self.openai_key)
        elif self.provider == "ollama":
            self._available = self._ollama_alive()
        else:
            self._available = False
        return self._available

    def _ollama_alive(self) -> bool:
        try:
            req = urllib.request.Request(f"{self.ollama_host}/api/tags")
            with urllib.request.urlopen(req, timeout=3) as r:
                return 200 <= r.status < 300
        except Exception:
            return False

    # ------------------------------------------------------------------ #
    # Chat dispatch
    # ------------------------------------------------------------------ #
    def chat(self, system_prompt: str, user_message: str,
             max_tokens: int = 350, temperature: float = 0.3) -> Optional[str]:
        if not self.is_available():
            return None
        try:
            if self.provider == "gemini":
                return self._chat_gemini(system_prompt, user_message, max_tokens, temperature)
            if self.provider == "claude":
                return self._chat_claude(system_prompt, user_message, max_tokens, temperature)
            if self.provider == "openai":
                return self._chat_openai(system_prompt, user_message, max_tokens, temperature)
            if self.provider == "ollama":
                return self._chat_ollama(system_prompt, user_message, max_tokens, temperature)
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = e.read().decode("utf-8", "ignore")[:600]
            except Exception:
                pass
            print(f"[llm:{self.provider}] HTTP {e.code} {getattr(e, 'reason', '')}: {detail}")
            if self.provider == "ollama":
                self._available = False
        except (urllib.error.URLError, TimeoutError, Exception) as e:
            print(f"[llm:{self.provider}] chat failed: {e}")
            if self.provider == "ollama":
                self._available = False
        return None

    def _post_json(self, url: str, payload: dict, headers: dict) -> dict:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", **headers},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=self.timeout) as r:
            return json.loads(r.read())

    # --- Gemini -------------------------------------------------------- #
    def _gemini_generate(self, model, system, user, max_tokens, temperature) -> Optional[str]:
        url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
               f"{model}:generateContent?key={self.gemini_key}")
        # Relax safety thresholds so legitimate medical triage text isn't
        # blocked. We still rely on our own PATIENT/DECISION system prompts.
        safety = [
            {"category": c, "threshold": "BLOCK_ONLY_HIGH"} for c in (
                "HARM_CATEGORY_HARASSMENT",
                "HARM_CATEGORY_HATE_SPEECH",
                "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "HARM_CATEGORY_DANGEROUS_CONTENT",
            )
        ]
        gen_cfg = {
            # Floor the budget so short answers are never cut off mid-sentence.
            "maxOutputTokens": max(max_tokens, 512),
            "temperature": temperature,
        }
        # Gemini 2.5 (and the *-latest aliases that point to it) "think" before
        # answering, and that thinking is billed against maxOutputTokens — which
        # truncates short replies. Disable thinking so all tokens go to the text.
        m = model.lower()
        if "2.5" in m or "latest" in m:
            gen_cfg["thinkingConfig"] = {"thinkingBudget": 0}
        payload = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": gen_cfg,
            "safetySettings": safety,
        }
        data = self._post_json(url, payload, headers={})
        cands = data.get("candidates") or []
        if not cands:
            return None
        parts = (cands[0].get("content") or {}).get("parts") or []
        text = "".join(p.get("text", "") for p in parts).strip()
        return text or None

    def _chat_gemini(self, system, user, max_tokens, temperature) -> Optional[str]:
        """Try the configured model; on 404 (unknown) or 429-with-zero-quota,
        roll through other supported models until one answers."""
        tried: Set[str] = set()
        model = self.model
        for _ in range(5):
            try:
                return self._gemini_generate(model, system, user, max_tokens, temperature)
            except urllib.error.HTTPError as e:
                body = ""
                try:
                    body = e.read().decode("utf-8", "ignore")
                except Exception:
                    pass
                no_quota = (e.code == 429 and "limit:0" in body.replace(" ", "").lower())
                unknown  = (e.code == 404)
                if not (unknown or no_quota):
                    # genuine error (real rate-limit, auth, etc.) — report & stop
                    print(f"[llm:gemini] HTTP {e.code} {getattr(e,'reason','')}: {body[:500]}")
                    return None
                tried.add(model)
                why = "unknown model" if unknown else "no free quota"
                alt = self._resolve_gemini_model(exclude=tried)
                if not alt:
                    print(f"[llm:gemini] '{model}' {why} (HTTP {e.code}); no other "
                          f"usable model for this key. Falling back to rule-based.")
                    # stop hammering the API for the rest of this process
                    self._available = False
                    return None
                print(f"[llm:gemini] '{model}' {why} (HTTP {e.code}); trying '{alt}'")
                self.model = alt
                model = alt
        return None

    # --- Claude -------------------------------------------------------- #
    def _chat_claude(self, system, user, max_tokens, temperature) -> Optional[str]:
        url = "https://api.anthropic.com/v1/messages"
        payload = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }
        headers = {
            "x-api-key": self.anthropic_key,
            "anthropic-version": "2023-06-01",
        }
        data = self._post_json(url, payload, headers)
        blocks = data.get("content") or []
        text = "".join(b.get("text", "") for b in blocks
                       if b.get("type") == "text").strip()
        return text or None

    # --- OpenAI -------------------------------------------------------- #
    def _chat_openai(self, system, user, max_tokens, temperature) -> Optional[str]:
        url = "https://api.openai.com/v1/chat/completions"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user",   "content": user},
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        headers = {"Authorization": f"Bearer {self.openai_key}"}
        data = self._post_json(url, payload, headers)
        choices = data.get("choices") or []
        if not choices:
            return None
        text = (choices[0].get("message") or {}).get("content", "").strip()
        return text or None

    # --- Ollama (local) ------------------------------------------------ #
    def _chat_ollama(self, system, user, max_tokens, temperature) -> Optional[str]:
        url = f"{self.ollama_host}/api/chat"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user",   "content": user},
            ],
            "stream": False,
            "options": {"num_predict": max_tokens, "temperature": temperature},
        }
        data = self._post_json(url, payload, headers={})
        content = (data.get("message") or {}).get("content", "")
        return content.strip() or None


# Module-level singleton — re-uses config/state across requests
_client: Optional[LLMClient] = None
def get_client() -> LLMClient:
    global _client
    if _client is None:
        _client = LLMClient()
    return _client


def reset_client() -> None:
    """Drop the cached client (e.g. after changing env vars in tests)."""
    global _client
    _client = None


# ---------------------------------------------------------------------------
# System prompts — strict role separation
# ---------------------------------------------------------------------------
PATIENT_SYSTEM = """You are a careful medical triage assistant for HealthMap Ghana, helping people in Ghana understand symptoms and find appropriate care. You are NOT a doctor and you do NOT diagnose.

Rules you must follow:
- Be calm, empathetic, plain-language. Avoid jargon. Avoid alarming wording.
- Use the structured triage data you are given. Do not invent new facts.
- Never give medication dosages. Suggest only over-the-counter relief or "consult a pharmacist".
- For emergencies, always tell the user to call 112 or 193 (Ghana ambulance).
- You MAY mention the single nearest facility by name and that tap-for-directions is available on their map, but do NOT list every facility.
- Do NOT mention staffing levels, facility scores, policy issues, or any system-level data — that is for administrators, not patients.
- Keep the response under 120 words. End with one reassuring sentence.

Output should be a short conversational paragraph (no lists, no headings). It complements the structured data below — do not repeat the full facility list."""

DECISION_SYSTEM = """You are an analytical assistant for HealthMap Ghana, supporting health administrators, planners and policymakers. You provide system-level analysis only.

Rules you must follow:
- Use the analytics data you are given. Do not invent districts, numbers or facilities.
- Cite specific numbers and district names from the data.
- When geographic context is provided, describe WHERE on the map the gaps cluster (e.g. northern belt vs southern belt, which regions), so the reader can locate them.
- Tone: concise, factual, policy-oriented. No medical advice, no personal symptom guidance.
- Do NOT tell anyone to take medication or visit a facility for themselves — that is for the patient assistant.
- Keep the response under 170 words. Use 2-3 short paragraphs, no bullet lists.

Output: a brief executive summary of the data including the geographic pattern, then 1-2 sentences naming the most pressing policy action."""
