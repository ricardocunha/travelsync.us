from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

from travel_sync_agents.schemas.source import ResearchDocument, SourceCitation, SourceType


def normalize_domain(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc.lower().removeprefix("www.")


def deduplicate_strings(values: list[str]) -> list[str]:
    deduplicated: list[str] = []
    seen: set[str] = set()

    for value in values:
        normalized = value.strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        deduplicated.append(normalized)

    return deduplicated


def _parse_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def _truncate_text(value: str | None, limit: int = 320) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.split())
    if len(normalized) <= limit:
        return normalized
    return f"{normalized[: limit - 3].rstrip()}..."


def map_exa_result(result: object, accessed_at: datetime | None = None) -> SourceCitation:
    result_url = str(getattr(result, "url", "") or "")
    result_title = str(getattr(result, "title", "") or "Untitled source")
    summary = getattr(result, "summary", None)
    highlights = getattr(result, "highlights", None)
    snippet = summary or (highlights[0] if isinstance(highlights, list) and highlights else None)

    return SourceCitation(
        title=result_title,
        url=result_url,
        domain=normalize_domain(result_url),
        source_type=SourceType.SEARCH,
        accessed_at=accessed_at or datetime.now(UTC),
        published_at=_parse_datetime(getattr(result, "published_date", None)),
        snippet=_truncate_text(str(snippet)) if snippet else None,
    )


def map_firecrawl_document(
    url: str,
    document: object,
    accessed_at: datetime | None = None,
) -> ResearchDocument:
    metadata = getattr(document, "metadata", None)
    if not isinstance(metadata, dict):
        metadata = {}

    title = str(metadata.get("title") or metadata.get("ogTitle") or url)
    summary = getattr(document, "summary", None)
    markdown = getattr(document, "markdown", None)
    warning = getattr(document, "warning", None)

    return ResearchDocument(
        title=title,
        url=url,
        domain=normalize_domain(url),
        accessed_at=accessed_at or datetime.now(UTC),
        markdown=_truncate_text(str(markdown), limit=2_400) if markdown else None,
        summary=_truncate_text(str(summary), limit=500) if summary else None,
        warning=str(warning) if warning else None,
    )


def document_to_citation(document: ResearchDocument) -> SourceCitation:
    snippet_source = document.summary or document.markdown
    return SourceCitation(
        title=document.title,
        url=document.url,
        domain=document.domain,
        source_type=SourceType.SCRAPE,
        accessed_at=document.accessed_at,
        snippet=_truncate_text(snippet_source),
    )


def merge_sources(
    search_sources: list[SourceCitation],
    documents: list[ResearchDocument],
) -> list[SourceCitation]:
    merged: dict[str, SourceCitation] = {}

    for source in search_sources:
        merged[source.url] = source

    for document in documents:
        merged[document.url] = document_to_citation(document)

    return list(merged.values())
