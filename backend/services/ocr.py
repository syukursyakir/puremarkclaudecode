# ================================================================
# PureMark Backend - OCR Service
# GPT-4o Vision for text extraction and parsing
# ================================================================

import httpx
import json
from typing import Dict, Any


async def extract_text_with_gpt_vision(image_base64: str, api_key: str) -> str:
    """
    Extract text from image using GPT-4o Vision.

    Args:
        image_base64: Base64 encoded image
        api_key: OpenAI API key

    Returns:
        Extracted text from the image
    """

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-4o",
        "messages": [
            {
                "role": "system",
                "content": """You are an OCR specialist. Extract ALL text from the food label image exactly as written.
Focus on the ingredients list section. Preserve the original language and formatting.
Return ONLY the raw text, no commentary or formatting."""
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract all text from this food label image, especially the ingredients list:"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}",
                            "detail": "high"
                        }
                    }
                ]
            }
        ],
        "max_tokens": 2000
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()

        data = response.json()
        return data["choices"][0]["message"]["content"]


async def parse_ingredient_text(
    ingredient_text: str,
    detected_language: str,
    api_key: str
) -> Dict[str, Any]:
    """
    Parse and structure ingredient text using GPT-4o-mini.

    Args:
        ingredient_text: Raw ingredient text
        detected_language: Detected language of text
        api_key: OpenAI API key

    Returns:
        Parsed ingredients with translations
    """

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": """You are a food ingredient parser. Parse the ingredient list and return JSON.

For each ingredient:
1. "original": The ingredient as written (preserve original language)
2. "english": English translation (if not already English)
3. "normalized": Lowercase, cleaned English name for matching

Also extract:
- "detected_language": The language of the ingredients
- "allergens": Any allergens mentioned (peanuts, tree nuts, milk, eggs, fish, shellfish, soy, wheat, sesame)

Return valid JSON only, no markdown."""
            },
            {
                "role": "user",
                "content": f"""Parse these ingredients (detected language: {detected_language}):

{ingredient_text}

Return JSON with format:
{{
  "detected_language": "string",
  "ingredients": [
    {{"original": "string", "english": "string", "normalized": "string"}}
  ],
  "allergens": ["string"]
}}"""
            }
        ],
        "max_tokens": 2000,
        "response_format": {"type": "json_object"}
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()

        data = response.json()
        content = data["choices"][0]["message"]["content"]

        # Parse JSON response
        try:
            parsed = json.loads(content)
            return parsed
        except json.JSONDecodeError:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            raise ValueError("Could not parse ingredient response")
