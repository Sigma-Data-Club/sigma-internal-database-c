from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    include_debug: bool = False


class AIToolCall(BaseModel):
    name: str
    ok: bool
    data: dict[str, Any] | list[dict[str, Any]] | list[str] | None = None
    error: str | None = None


class AIChatResponse(BaseModel):
    answer: str
    tools_used: list[str] = []
    debug: list[AIToolCall] | None = None