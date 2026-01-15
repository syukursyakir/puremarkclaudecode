# ================================================================
# PureMark Backend - OCR Service
# Gemini 2.0 Flash for text extraction (cheapest & best for OCR)
# GPT-4o-mini for parsing
# ================================================================

import google.generativeai as genai
import httpx
import json
import base64
from typing import Dict, Any


async def extract_text_with_gemini(image_base64: str, api_key: str) -> str:
    """
    Extract text from image using Gemini 2.0 Flash.

    Args:
        image_base64: Base64 encoded image
        api_key: Google AI API key

    Returns:
        Extracted text from the image
    """

    # Configure Gemini
    genai.configure(api_key=api_key)

    # Detect image type from base64 header
    mime_type = "image/jpeg"  # default
    if image_base64.startswith("/9j/"):
        mime_type = "image/jpeg"
    elif image_base64.startswith("iVBOR"):
        mime_type = "image/png"
    elif image_base64.startswith("UklGR"):
        mime_type = "image/webp"

    # Decode base64 to bytes
    image_bytes = base64.b64decode(image_base64)

    # Create the model
    model = genai.GenerativeModel("gemini-2.0-flash")

    # Create image part
    image_part = {
        "mime_type": mime_type,
        "data": image_bytes
    }

    # Generate content
    response = model.generate_content(
        [
            image_part,
            """You are an OCR specialist. Extract ALL text from this food label image exactly as written.
Focus on the ingredients list section. Preserve the original language and formatting.
Return ONLY the raw text, no commentary or formatting."""
        ],
        generation_config=genai.GenerationConfig(
            max_output_tokens=2000,
            temperature=0.1
        )
    )

    return response.text


# Keep the old function name as alias for compatibility
async def extract_text_with_gpt_vision(image_base64: str, api_key: str) -> str:
    """Alias - now uses Gemini 2.0 Flash."""
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
