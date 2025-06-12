import logging
import httpx
import json
import re
import config.env 

from config.env import *

logger = logging.getLogger(__name__)


class OpenAIService:
    def __init__(self):
        self.api_base_url = 'http://localhost:8001/v1/chat/completions'
        self.default_model = "gpt-3.5-turbo"
    def refine_idea(self, idea_text, conversation_history=None):
        prompt = self._build_refinement_prompt(idea_text, conversation_history)
        payload = {
            "model": 'gpt-4o-mini',
            "messages": prompt,
            "temperature": 0.7,
            "max_tokens": 512,
            "stream": False
        }

        try:
            headers = {'Content-Type': 'application/json'}

            # Log CURL command
            curl_cmd = (
                f"curl -X POST {self.api_base_url} "
                f"-H 'Content-Type: application/json' "
                f"-d '{json.dumps(payload)}'"
            )
            print("\n\nCURL command:\n\n%s", curl_cmd)
            print("\n\n")

            # Send request
            response = httpx.post(self.api_base_url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

            # Log full pretty-printed JSON response
            pretty_json = json.dumps(data, indent=2)
            print("\n\nFormatted JSON response:\n\n%s", pretty_json)

            # Return parsed result
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
