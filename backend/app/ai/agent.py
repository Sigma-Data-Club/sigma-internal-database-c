from __future__ import annotations

import re

from sqlalchemy.orm import Session

from app.ai.context import build_access_context
from app.ai.schemas import AIChatResponse, AIToolCall
from app.ai.tools.access import get_my_access_profile
from app.ai.tools.events import list_my_accessible_events
from app.ai.tools.members import get_my_profile
from app.ai.tools.projects import list_my_accessible_projects
from app.models.member import Member


class ReadOnlyClubAgent:
    """
    First MVP version:
    - read-only
    - permission-aware
    - deterministic routing
    - no direct DB access by the model layer
    """

    def run(
        self,
        *,
        db: Session,
        current_member: Member,
        message: str,
        include_debug: bool = False,
    ) -> AIChatResponse:
        ctx = build_access_context(db, current_member)
        text = self._normalize(message)

        tool_calls: list[AIToolCall] = []

        if self._is_access_question(text):
            tool_calls.append(get_my_access_profile(ctx))
            answer = self._answer_access(tool_calls[-1])

        elif self._is_profile_question(text):
            tool_calls.append(get_my_profile(ctx))
            answer = self._answer_profile(tool_calls[-1])

        elif self._is_projects_question(text):
            tool_calls.append(list_my_accessible_projects(db, ctx))
            answer = self._answer_projects(tool_calls[-1])

        elif self._is_events_question(text):
            tool_calls.append(list_my_accessible_events(db, ctx))
            answer = self._answer_events(tool_calls[-1])

        else:
            access_tool = get_my_access_profile(ctx)
            tool_calls.append(access_tool)
            answer = self._answer_fallback(access_tool)

        return AIChatResponse(
            answer=answer,
            tools_used=[t.name for t in tool_calls],
            debug=tool_calls if include_debug else None,
        )

    def _normalize(self, text: str) -> str:
        return re.sub(r"\s+", " ", text.strip().lower())

    def _is_access_question(self, text: str) -> bool:
        keywords = [
            "permission",
            "permissions",
            "role",
            "roles",
            "access",
            "allowed",
            "can i",
            "what can i see",
            "what do i have access to",
            "rights",
        ]
        return any(k in text for k in keywords)

    def _is_profile_question(self, text: str) -> bool:
        keywords = [
            "my profile",
            "profile",
            "who am i",
            "my data",
            "my information",
            "my member data",
        ]
        return any(k in text for k in keywords)

    def _is_projects_question(self, text: str) -> bool:
        keywords = [
            "project",
            "projects",
        ]
        return any(k in text for k in keywords)

    def _is_events_question(self, text: str) -> bool:
        keywords = [
            "event",
            "events",
        ]
        return any(k in text for k in keywords)

    def _answer_access(self, tool: AIToolCall) -> str:
        if not tool.ok or not isinstance(tool.data, dict):
            return "I could not retrieve your access profile."

        roles = tool.data.get("roles", [])
        perms = tool.data.get("permissions", [])

        roles_text = ", ".join(roles) if roles else "no roles assigned"
        perms_text = ", ".join(perms) if perms else "no permissions assigned"

        return (
            f"You are signed in as member {tool.data['member_id']}. "
            f"Your roles: {roles_text}. "
            f"Your permissions: {perms_text}."
        )

    def _answer_profile(self, tool: AIToolCall) -> str:
        if not tool.ok or not isinstance(tool.data, dict):
            return "I could not retrieve your profile."

        d = tool.data
        full_name = f"{d.get('first_name', '')} {d.get('last_name', '')}".strip()

        return (
            f"Your profile shows: {full_name}, "
            f"email {d.get('email')}, "
            f"phone {d.get('phone')}, "
            f"academic_program_id {d.get('academic_program_id')}, "
            f"study_year {d.get('study_year')}, "
            f"is_active={d.get('is_active')}."
        )

    def _answer_projects(self, tool: AIToolCall) -> str:
        if not tool.ok:
            return tool.error or "You do not have access to projects."

        if not isinstance(tool.data, dict):
            return "I could not retrieve your projects."

        items = tool.data.get("items", [])
        total = tool.data.get("total", 0)

        if not items:
            return "You have access to projects, but no projects were returned."

        names = []
        for item in items[:10]:
            name = item.get("name")
            if name:
                names.append(name)

        if names:
            return f"You can access {total} project(s). Here are some of them: {', '.join(names)}."
        return f"You can access {total} project(s)."

    def _answer_events(self, tool: AIToolCall) -> str:
        if not tool.ok:
            return tool.error or "You do not have access to events."

        if not isinstance(tool.data, dict):
            return "I could not retrieve events."

        items = tool.data.get("items", [])
        total = tool.data.get("total", 0)

        if not items:
            return "You have access to events, but no events were returned."

        titles = []
        for item in items[:10]:
            title = item.get("title")
            if title:
                titles.append(title)

        if titles:
            return f"You can access {total} event(s). Here are some of them: {', '.join(titles)}."
        return f"You can access {total} event(s)."

    def _answer_fallback(self, access_tool: AIToolCall) -> str:
        if not access_tool.ok:
            return (
                "I can only help with read-only requests about your access, profile, "
                "projects, and events."
            )

        perms = access_tool.data.get("permissions", []) if isinstance(access_tool.data, dict) else []

        lines = [
            "I currently support read-only questions only.",
            "You can ask me about your permissions, your profile, visible projects, and visible events.",
        ]

        if "project.read" not in perms:
            lines.append("You do not currently have project.read.")
        if "event.read" not in perms:
            lines.append("You do not currently have event.read.")

        return " ".join(lines)