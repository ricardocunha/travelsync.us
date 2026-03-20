from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class SourceType(str, Enum):
    SEARCH = "search"
    SCRAPE = "scrape"


class SourceCitation(BaseModel):
    title: str
    url: str
    domain: str
    source_type: SourceType
    accessed_at: datetime
    published_at: datetime | None = None
    snippet: str | None = None


class ResearchDocument(BaseModel):
    title: str
    url: str
    domain: str
    accessed_at: datetime
    markdown: str | None = None
    summary: str | None = None
    warning: str | None = None


class ResearchDossier(BaseModel):
    query: str
    search_sources: list[SourceCitation] = Field(default_factory=list)
    documents: list[ResearchDocument] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)

    def to_prompt_payload(self) -> list[dict[str, Any]]:
        entries: list[dict[str, Any]] = []

        for document in self.documents:
            excerpt_source = document.summary or document.markdown or ""
            entries.append(
                {
                    "title": document.title,
                    "url": document.url,
                    "domain": document.domain,
                    "accessed_at": document.accessed_at.isoformat(),
                    "summary": document.summary,
                    "content_excerpt": excerpt_source[:1200],
                }
            )

        if entries:
            return entries

        for source in self.search_sources:
            entries.append(
                {
                    "title": source.title,
                    "url": source.url,
                    "domain": source.domain,
                    "accessed_at": source.accessed_at.isoformat(),
                    "summary": source.snippet,
                    "content_excerpt": source.snippet,
                }
            )

        return entries
