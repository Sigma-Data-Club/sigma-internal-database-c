from typing import Any, List
from pydantic import BaseModel, Field


class AIMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class AIChatRequest(BaseModel):
    messages: List[AIMessage] = Field(min_items=1)
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