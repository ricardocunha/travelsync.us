from __future__ import annotations

from datetime import UTC, datetime

from travel_sync_agents.mappers.source_mapper import map_exa_result, merge_sources, normalize_domain
from travel_sync_agents.schemas.source import ResearchDocument, SourceCitation, SourceType


class FakeExaResult:
    def __init__(self) -> None:
        self.title = "Lisbon Tourism"
        self.url = "https://www.visitlisboa.com/en"
        self.summary = "Official destination guide with seasonal opening details."
        self.highlights = None
        self.published_date = "2026-03-20T10:00:00Z"


def test_normalize_domain_removes_www_prefix() -> None:
    assert normalize_domain("https://www.example.com/path") == "example.com"


def test_map_exa_result_builds_source_citation() -> None:
    citation = map_exa_result(FakeExaResult(), accessed_at=datetime(2026, 3, 20, tzinfo=UTC))

    assert citation.title == "Lisbon Tourism"
    assert citation.domain == "visitlisboa.com"
    assert citation.source_type == SourceType.SEARCH
    assert citation.published_at == datetime(2026, 3, 20, 10, 0, tzinfo=UTC)


def test_merge_sources_prefers_scraped_document_for_same_url() -> None:
    search_source = SourceCitation(
        title="Visit Lisbon",
        url="https://www.visitlisboa.com/en",
        domain="visitlisboa.com",
        source_type=SourceType.SEARCH,
        accessed_at=datetime(2026, 3, 20, tzinfo=UTC),
        snippet="Search snippet",
    )
    document = ResearchDocument(
        title="Visit Lisbon Official Guide",
        url="https://www.visitlisboa.com/en",
        domain="visitlisboa.com",
        accessed_at=datetime(2026, 3, 20, tzinfo=UTC),
        markdown="Rich official content",
        summary="Verified guide",
    )

    merged = merge_sources([search_source], [document])

    assert len(merged) == 1
    assert merged[0].source_type == SourceType.SCRAPE
    assert merged[0].title == "Visit Lisbon Official Guide"
