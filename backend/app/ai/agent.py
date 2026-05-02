from __future__ import annotations

from typing import List

from sqlalchemy.orm import Session

from app.ai.context import build_access_context
from app.ai.gemini_client import GeminiClient
from app.ai.prompt import build_system_prompt
from app.ai.schemas import AIChatResponse, AIMessage, AIToolCall
from app.ai.tools.access import get_my_access_profile
from app.ai.tools.events import list_my_accessible_events
from app.ai.tools.members import get_my_profile
from app.ai.tools.projects import list_my_accessible_projects
from app.models.member import Member


class ReadOnlyClubAgent:
    def __init__(self) -> None:
        self.llm: GeminiClient | None = None

    def _get_llm(self) -> GeminiClient:
        if self.llm is None:
            self.llm = GeminiClient()
        return self.llm

    def run(
        self,
        *,
        db: Session,
        current_member: Member,
        messages: List[AIMessage],
        include_debug: bool = False,
    ) -> AIChatResponse:
        ctx = build_access_context(db, current_member)

        tool_calls: list[AIToolCall] = []

        access_tool = get_my_access_profile(ctx)
        profile_tool = get_my_profile(ctx)

        tool_calls.extend([access_tool, profile_tool])

        if "project.read" in ctx.permission_keys:
            tool_calls.append(list_my_accessible_projects(db, ctx, limit=10))

        if "event.read" in ctx.permission_keys:
            tool_calls.append(list_my_accessible_events(db, ctx, limit=10))

        tool_context_text = self._format_tool_context(tool_calls)

        llm_messages = [
            {"role": "system", "content": build_system_prompt()},
            {
                "role": "system",
                "content": f"Available data:\n{tool_context_text}",
            },
        ]

        for message in messages:
            llm_messages.append(
                {
                    "role": message.role,
                    "content": message.content,
                }
            )

        answer = self._get_llm().generate(llm_messages)

        return AIChatResponse(
            answer=answer,
            tools_used=[tool.name for tool in tool_calls],
            debug=tool_calls if include_debug else None,
        )

    def _format_tool_context(self, tools: list[AIToolCall]) -> str:
        lines: list[str] = []

        for tool in tools:
            if not tool.ok:
                lines.append(f"{tool.name}: ERROR -> {tool.error}")
                continue

            lines.append(f"{tool.name}: {tool.data}")

        return "\n".join(lines)