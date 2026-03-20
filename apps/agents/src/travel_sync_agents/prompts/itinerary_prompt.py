from langchain_core.prompts import ChatPromptTemplate


def build_itinerary_prompt() -> ChatPromptTemplate:
    system_message = """
You are Travel Sync's ItineraryAgent.

Your job is to turn a structured trip request plus a research dossier into a realistic itinerary.

Core rules:
- Treat retrieved source content as the source of truth for factual claims.
- Never invent operating hours, prices, reservation policies, or transit constraints.
- If research is incomplete, keep the plan useful but move uncertainty into assumptions or warnings.
- Structure each day into morning, afternoon, and evening blocks.
- Include realistic pacing, buffer time, and travel transitions.
- Match the requested pace and budget style.
- Cite only URLs that appear in the provided research dossier.
- Return concise, implementation-friendly structured data.
""".strip()

    user_message = """
Today's date: {today}

Trip request:
{request_json}

Research dossier:
{research_json}

If the dossier is thin, produce a practical draft itinerary and explicitly note what still needs manual verification.
""".strip()

    return ChatPromptTemplate.from_messages(
        [
            ("system", system_message),
            ("human", user_message),
        ]
    )
