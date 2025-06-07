import openai
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        self.api_key = getattr(settings, "OPENAI_API_KEY", None)
        openai.api_key = self.api_key

    def refine_idea(self, idea_text, conversation_history=None):
        prompt = self._build_refinement_prompt(idea_text, conversation_history)
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=prompt,
                max_tokens=512,
                temperature=0.7,
            )
            return response.choices[0].message["content"]
        except Exception as e:
            logger.error(f"OpenAI refinement error: {e}")
            return "Sorry, there was an error refining your idea. Please try again later."

    def score_idea(self, idea_text):
        prompt = (
            "Score the following idea on a scale of 1-10 for each category:\n"
            "Clarity, Creativity, Feasibility, Relevance.\n"
            "Respond in JSON format: {\"clarity\": x, \"creativity\": y, \"feasibility\": z, \"relevance\": w}\n\n"
            f"Idea: {idea_text}"
        )
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=256,
                temperature=0.2,
            )
            import json
            import re
            content = response.choices[0].message["content"]
            # Extract JSON from response
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            else:
                logger.error(f"OpenAI scoring response not in JSON: {content}")
                return None
        except Exception as e:
            logger.error(f"OpenAI scoring error: {e}")
            return None

    def _build_refinement_prompt(self, idea_text, conversation_history):
        messages = []
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({
            "role": "system",
            "content": (
                "You are an expert product manager and innovation coach. "
                "Help the user refine and improve their idea through a friendly, constructive chat. "
                "Ask clarifying questions, suggest improvements, and help them make the idea more actionable."
            ),
        })
        messages.append({
            "role": "user",
            "content": f"My idea: {idea_text}",
        })
        return messages
