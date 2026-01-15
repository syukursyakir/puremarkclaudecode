# ================================================================
# PureMark Backend - OCR Service
# Gemini 2.0 Flash via OpenRouter for text extraction
# GPT-4o-mini for parsing
# ================================================================

import httpx
import json
import base64
from typing import Dict, Any


async def extract_text_with_gemini(image_base64: str, api_key: str) -> str:
    """
    Extract text from image using Gemini 2.0 Flash via OpenRouter.

    Args:
        image_base64: Base64 encoded image
        api_key: OpenRouter API key

    Returns:
        Extracted text from the image
    """

    # Detect image type from base64 header
    media_type = "image/jpeg"  # default
    if image_base64.startswith("/9j/"):
        media_type = "image/jpeg"
    elif image_base64.startswith("iVBOR"):
        media_type = "image/png"
    elif image_base64.startswith("UklGR"):
        media_type = "image/webp"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://puremark.app",
        "X-Title": "PureMark"
    }

    payload = {
        "model": "google/gemini-2.0-flash-001",
        "max_tokens": 2000,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{media_type};base64,{image_base64}"
                        }
                    },
                    {
                        "type": "text",
                        "text": """You are an OCR specialist extracting text from food product packaging.

IMPORTANT: Extract ALL visible text from this image. Be GENEROUS - include MORE text rather than less.
The user may have captured a wide area, so extract everything you see including:
- Ingredients lists (in ANY language)
- Product names
- Nutritional information
- Any other text visible

It is CRITICAL that you do not miss any ingredients. The parsing step will filter out irrelevant text.
If you see text that might be ingredients, INCLUDE IT even if you're unsure.

Preserve the original language exactly as written. Return ONLY the raw extracted text, no commentary."""
                    }
                ]
            }
        ]
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()

        data = response.json()
        return data["choices"][0]["message"]["content"]


# Keep the old function name as alias for compatibility
async def extract_text_with_gpt_vision(image_base64: str, api_key: str) -> str:
    """Alias - now uses Gemini 2.0 Flash via OpenRouter."""
    return await extract_text_with_gemini(image_base64, api_key)


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
