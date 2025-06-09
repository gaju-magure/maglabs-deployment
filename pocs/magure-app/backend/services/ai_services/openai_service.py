import logging
import httpx
import json
import re
import config.env 

from config.env import *

logger = logging.getLogger(__name__)


class OpenAIService:
    def __init__(self):
        self.api_base_url = services.ai_service_url
        self.default_model = "gpt-3.5-turbo"
    def refine_idea(self, idea_text, conversation_history=None):
        prompt = self._build_refinement_prompt(idea_text, conversation_history)
        payload = {
            "model": self.default_model,
            "messages": prompt,
            "temperature": 0.7,
            "max_tokens": 512,
            "stream": False
        }

        try:
            response = httpx.post(self.api_base_url, json=payload)
            response.raise_for_status()
            data = response.json()

            if data.get("choices"):
                return data["choices"][0]["message"]["content"]
            return "No valid response received."
        except Exception as e:
            logger.error(f"Local API refinement error: {e}")
            return "Sorry, there was an error refining your idea. Please try again later."

    def score_idea(self, idea_text):
        prompt = (
            "Score the following idea on a scale of 1-10 for each category:\n"
            "Clarity, Creativity, Feasibility, Relevance.\n"
            "Respond in JSON format: {\"clarity\": x, \"creativity\": y, \"feasibility\": z, \"relevance\": w}\n\n"
            f"Idea: {idea_text}"
        )

        payload = {
            "model": self.default_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 256,
            "stream": False
        }

        try:
            response = httpx.post(self.api_base_url, json=payload)
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]

            match = re.search(r"\{.*\}", content, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            else:
                logger.warning(f"Score idea response not in JSON format: {content}")
                return None
        except Exception as e:
            logger.error(f"Local API scoring error: {e}")
            return None

    def _build_refinement_prompt(self, idea_text, conversation_history):
        messages = []

        if conversation_history:
            messages.extend(conversation_history)  # Should already follow {role, content} format

        messages.append({
            "role": "system",
            "content": (
                "You are an expert product manager and innovation coach. "
                "Help the user refine and improve their idea through a friendly, constructive chat. "
                "Ask clarifying questions, suggest improvements, and help them make the idea more actionable."
            )
        })

        messages.append({
            "role": "user",
            "content": f"My idea: {idea_text}"
        })

        return messages
