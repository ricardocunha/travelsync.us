from __future__ import annotations

from datetime import date
from enum import Enum

from pydantic import BaseModel, Field, model_validator

from travel_sync_agents.schemas.source import SourceCitation


class TripPace(str, Enum):
    RELAXED = "relaxed"
    MODERATE = "moderate"
    FAST = "fast"


class BudgetStyle(str, Enum):
    BUDGET = "budget"
    MID_RANGE = "mid-range"
    LUXURY = "luxury"


class TravelerProfile(BaseModel):
    name: str = Field(min_length=1)
    origin: str | None = None
    traveler_type: str | None = None


class ItineraryRequest(BaseModel):
    destination: str = Field(min_length=2)
    start_date: date
    end_date: date
    travelers: list[TravelerProfile] = Field(min_length=1)
    pace: TripPace = TripPace.MODERATE
    budget_style: BudgetStyle = BudgetStyle.MID_RANGE
    interests: list[str] = Field(default_factory=list)
    priorities: list[str] = Field(default_factory=list)
    must_include: list[str] = Field(default_factory=list)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_date_range(self) -> "ItineraryRequest":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self

    @property
    def day_count(self) -> int:
        return (self.end_date - self.start_date).days + 1

    @property
    def traveler_summary(self) -> str:
        counts_by_type: dict[str, int] = {}
        for traveler in self.travelers:
            label = traveler.traveler_type or "general"
            counts_by_type[label] = counts_by_type.get(label, 0) + 1

        summary_parts = [f"{len(self.travelers)} travelers"]
        if counts_by_type:
            typed_breakdown = ", ".join(
                f"{count} {traveler_type}" for traveler_type, count in sorted(counts_by_type.items())
            )
            summary_parts.append(typed_breakdown)

        return " | ".join(summary_parts)


class ItineraryActivity(BaseModel):
    start_time: str = Field(min_length=1)
    end_time: str = Field(min_length=1)
    title: str = Field(min_length=1)
    location: str = Field(min_length=1)
    description: str = Field(min_length=1)
    travel_method: str | None = None
    travel_duration_minutes: int | None = Field(default=None, ge=0)
    notes: list[str] = Field(default_factory=list)
    source_urls: list[str] = Field(default_factory=list)


class ItineraryDay(BaseModel):
    day_number: int = Field(ge=1)
    date: date
    day_of_week: str = Field(min_length=1)
    morning: list[ItineraryActivity] = Field(default_factory=list)
    afternoon: list[ItineraryActivity] = Field(default_factory=list)
    evening: list[ItineraryActivity] = Field(default_factory=list)
    daily_notes: list[str] = Field(default_factory=list)


class PracticalNotes(BaseModel):
    weather_considerations: list[str] = Field(default_factory=list)
    transportation_tips: list[str] = Field(default_factory=list)
    reservation_reminders: list[str] = Field(default_factory=list)
    backup_plans: list[str] = Field(default_factory=list)


class ItineraryData(BaseModel):
    destination: str
    start_date: date
    end_date: date
    traveler_summary: str
    pace: TripPace
    budget_style: BudgetStyle
    priorities: list[str] = Field(default_factory=list)
    days: list[ItineraryDay] = Field(default_factory=list)
    practical_notes: PracticalNotes = Field(default_factory=PracticalNotes)


class ItineraryResponse(BaseModel):
    summary: str
    data: ItineraryData
    sources: list[SourceCitation] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
