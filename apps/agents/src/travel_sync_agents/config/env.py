from __future__ import annotations

import os
from functools import lru_cache

from dotenv import find_dotenv, load_dotenv
from pydantic import BaseModel, Field

from travel_sync_agents.errors import AgentConfigurationError


def _load_root_env() -> None:
    env_file = find_dotenv(".env", raise_error_if_not_found=False)
    if env_file:
        load_dotenv(env_file, override=False)


def _get_required_env(name: str) -> str:
    value = os.getenv(name)
    if value:
        return value
    raise AgentConfigurationError(f"Missing required environment variable: {name}")


class AgentSettings(BaseModel):
    openai_api_key: str
    openai_model: str = "gpt-4.1-mini"
    exa_api_key: str
    firecrawl_api_key: str
    exa_num_results: int = Field(default=6, ge=1, le=10)
    max_scraped_sources: int = Field(default=4, ge=1, le=8)
    firecrawl_timeout_ms: int = Field(default=15_000, ge=1_000)


class ApiSettings(BaseModel):
    host: str = "127.0.0.1"
    port: int = Field(default=3001, ge=1, le=65535)


@lru_cache(maxsize=1)
def get_agent_settings() -> AgentSettings:
    _load_root_env()
    return AgentSettings(
        openai_api_key=_get_required_env("OPENAI_API_KEY"),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        exa_api_key=_get_required_env("EXA_API_KEY"),
        firecrawl_api_key=_get_required_env("FIRECRAWL_API_KEY"),
        exa_num_results=int(os.getenv("EXA_NUM_RESULTS", "6")),
        max_scraped_sources=int(os.getenv("MAX_SCRAPED_SOURCES", "4")),
        firecrawl_timeout_ms=int(os.getenv("FIRECRAWL_TIMEOUT_MS", "15000")),
    )


@lru_cache(maxsize=1)
def get_api_settings() -> ApiSettings:
    _load_root_env()
    return ApiSettings(
        host=os.getenv("API_HOST", "127.0.0.1"),
        port=int(os.getenv("API_PORT", "3001")),
    )
