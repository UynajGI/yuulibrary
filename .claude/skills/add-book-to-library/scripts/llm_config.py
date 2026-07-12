"""Shared LLM + pipeline config for the translation pipeline.

Reads two sources:
  - config.yaml  (non-sensitive: model names, base URLs, pipeline toggles, thresholds)
  - .env         (sensitive: API keys only)

Fallback: if config.yaml is absent or PyYAML is not installed, degrades to the
legacy single-model behavior (DEEPSEEK_MODEL / DEEPSEEK_BASE_URL from .env),
so existing users notice nothing until they opt in.

Usage:
    from llm_config import get_tier, get_pipeline_config
    api_key, base_url, model, max_tokens = get_tier("strong")
    cfg = get_pipeline_config()   # {"review": True, "consistency_qa": True, ...}
"""
import os

# ── Path setup ───────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(SCRIPT_DIR, "..", "..", "..", "..")
CONFIG_PATH = os.path.join(PROJECT_ROOT, "config.yaml")
ENV_PATH = os.path.join(PROJECT_ROOT, ".env")

# ── Load .env (optional, same pattern as before) ─────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv(ENV_PATH)
except ImportError:
    pass  # rely on env vars being set in the shell

# ── Load config.yaml (optional) ──────────────────────────────────────────
_config = None
try:
    import yaml
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, encoding="utf-8") as f:
            _config = yaml.safe_load(f) or {}
except ImportError:
    pass  # PyYAML not installed — fall back to legacy single-model mode

# ── Defaults (legacy single-model behavior) ──────────────────────────────
_DEFAULT_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-flash")
_DEFAULT_BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
_DEFAULT_API_KEY = os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("OPENAI_API_KEY", "")

_DEFAULT_PIPELINE = {
    "review": True,
    "consistency_qa": True,
    "backtranslate": False,
    "autofix_severe": True,
}

_DEFAULT_SEGMENT = {
    "max_chars_per_batch": 4500,
    "max_chars_per_segment": 2000,
}

# Legacy per-script max_tokens (translate_chapters=8192, generate_paper_note=16384)
_LEGACY_MAX_TOKENS = {
    "strong": 8192,
    "cheap": 4096,
    "fast": 4096,
}


def _api_key_for(base_url: str) -> str:
    """Resolve API key for a given base_url. Falls back across providers."""
    if "deepseek" in base_url:
        return os.environ.get("DEEPSEEK_API_KEY") or _DEFAULT_API_KEY
    if "openai" in base_url:
        return os.environ.get("OPENAI_API_KEY") or _DEFAULT_API_KEY
    if "mimo" in base_url or "xiaomimimo" in base_url:
        return os.environ.get("MIMO_API_KEY", "")
    if "glm" in base_url or "zhipu" in base_url:
        return os.environ.get("GLM_API_KEY") or os.environ.get("ZHIPUAI_API_KEY", "")
    return _DEFAULT_API_KEY


def get_tier(name: str):
    """Return (api_key, base_url, model, max_tokens) for a tier.

    Tiers: 'strong' (translation, analysis), 'cheap' (review, QA),
    'fast' (glossary extraction, mechanical tasks).

    Without config.yaml, all tiers collapse to the legacy single model.
    """
    tiers = (_config or {}).get("llm", {}).get("tiers", {}) if _config else {}
    tier = tiers.get(name, {})

    model = tier.get("model", _DEFAULT_MODEL)
    base_url = tier.get("base_url", _DEFAULT_BASE_URL)
    max_tokens = tier.get("max_tokens", _LEGACY_MAX_TOKENS.get(name, 8192))
    api_key = _api_key_for(base_url)

    return (api_key, base_url, model, max_tokens)


def get_pipeline_config() -> dict:
    """Return pipeline toggles. Merges config.yaml over defaults."""
    if not _config:
        return dict(_DEFAULT_PIPELINE)
    cfg = (_config.get("pipeline") or {})
    merged = dict(_DEFAULT_PIPELINE)
    merged.update({k: v for k, v in cfg.items() if k in _DEFAULT_PIPELINE})
    return merged


def get_segment_config() -> dict:
    """Return segment thresholds (chunk sizes). Merges config.yaml over defaults."""
    if not _config:
        return dict(_DEFAULT_SEGMENT)
    cfg = (_config.get("segment") or {})
    merged = dict(_DEFAULT_SEGMENT)
    merged.update({k: v for k, v in cfg.items() if k in _DEFAULT_SEGMENT})
    return merged


def has_config() -> bool:
    """True if config.yaml was loaded. Useful for status messages."""
    return _config is not None
