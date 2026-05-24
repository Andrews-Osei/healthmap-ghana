"""HealthMap Ghana — LLM connectivity check.

Run from the backend/ folder:

    python check_llm.py

It loads your .env exactly like the server does, shows what provider/key/model
were detected, lists the Gemini models your key can use (if applicable), then
makes ONE real call so you can see whether the model answers — and if not, the
exact error.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import app.config  # noqa: F401  (importing it loads .env into the environment)
from app.services.assistant.llm import get_client

c = get_client()
key = c.active_key()

print("=" * 60)
print("HealthMap Ghana — LLM check")
print("=" * 60)
print(f"Provider     : {c.provider}")
print(f"Model        : {c.model}")
print(f"LLM disabled : {c.disabled}")
if c.provider == "ollama":
    print(f"Ollama host  : {c.ollama_host}")
else:
    if key:
        print(f"API key      : found (length {len(key)}, starts '{key[:6]}…')")
    else:
        print("API key      : NOT FOUND")
print(f"Available    : {c.is_available()}")
print("-" * 60)

if not c.is_available():
    print("RESULT: the assistant will use RULE-BASED answers.")
    if c.disabled:
        print("Reason : LLM is disabled (LLM_PROVIDER=none or LLM_DISABLED set).")
    elif c.provider != "ollama" and not key:
        print(f"Reason : no API key found for provider '{c.provider}'.")
        print("Fix    : put your key in .env, e.g. GEMINI_API_KEY=AIza...,")
        print("         then make sure the file is named exactly '.env'")
        print("         (not '.env.txt').")
    sys.exit(0)

# Show which Gemini models this key supports (handy if a name 404s)
if c.provider == "gemini":
    try:
        models = c.list_gemini_models()
        print("Models your key supports for generateContent:")
        for m in models:
            star = "  <- in use" if m == c.model else ""
            print(f"   - {m}{star}")
        if c.model not in models:
            print(f"   (note: '{c.model}' is NOT in the list; the client will "
                  f"auto-switch to a supported one on first call.)")
    except Exception as e:
        print(f"Could not list models: {e}")
    print("-" * 60)

print("Calling the model now (this makes one network request)…\n")
out = c.chat("You are a connectivity test.", "Reply with the single word: OK")
print("-" * 60)
if out:
    print("SUCCESS ✓  The model replied:")
    print("   ", repr(out))
    print(f"\nYour assistant is LIVE on {c.provider} / {c.model}.")
    print("If the API still shows narrative_source=rule_based, RESTART the")
    print("backend fully (close the terminal, start uvicorn again) — editing")
    print(".env does not trigger the --reload watcher.")
else:
    print("FAILED ✗  The model did not reply.")
    print("Look just ABOVE this block for a line starting with")
    print(f"   [llm:{c.provider}] ...")
    print("That line is the exact reason (bad key, unknown model, quota, etc.).")
