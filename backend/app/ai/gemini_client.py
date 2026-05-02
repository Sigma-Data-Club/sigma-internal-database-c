from __future__ import annotations

import logging
import os
from typing import Dict, List

from google.genai import Client

logger = logging.getLogger(__name__)


class GeminiClient:
    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")

        self.client = Client(api_key=api_key)
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

        logger.info("GeminiClient initialized with model=%s", self.model)

    def generate(self, messages: List[Dict[str, str]]) -> str:
        logger.info("Gemini generate called with messages_count=%s", len(messages))

        contents = []

        for message in messages:
            role = message["role"]
            content = message["content"]

            # Gemini API usually expects only user/model roles.
            # We convert system messages into user messages.
            gemini_role = "model" if role == "assistant" else "user"

            contents.append(
                {
                    "role": gemini_role,
                    "parts": [{"text": content}],
                }
            )

        logger.info("Sending request to Gemini model=%s", self.model)

        response = self.client.models.generate_content(
            model=self.model,
            contents=contents,
        )

        logger.info("Gemini raw response type=%s", type(response).__name__)

        text = getattr(response, "text", None)
        if text:
            logger.info("Gemini response received via response.text")
            return text

        try:
            text = response.candidates[0].content.parts[0].text
            logger.info("Gemini response received via candidates[0]")
            return text
        except Exception as exc:
            logger.error("Could not parse Gemini response: %s", str(exc))
            logger.error("Raw Gemini response: %s", response)
            raise RuntimeError("Gemini returned an empty or unsupported response format")