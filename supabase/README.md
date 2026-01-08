# PureMark Supabase Edge Functions

TypeScript port of the Python halal food scanner backend, designed to run on Supabase Edge Functions (Deno runtime).

## Project Details

- **Project URL**: https://xnzgmgjuxisclvjvnppy.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuemdtZ2p1eGlzY2x2anZucHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDM1MzcsImV4cCI6MjA4MzQ3OTUzN30.1NKWb6mjmbEVKsUhTfbHBE6LHlrf0-cDD9fz_n4J7YA

## Directory Structure

```
supabase/
├── config.toml           # Supabase project configuration
├── README.md             # This file
└── functions/
    ├── .env.example      # Environment variables template
    ├── scan/
    │   └── index.ts      # Main /scan endpoint
    └── _shared/
        ├── config.ts     # Embedded halal/kosher/allergen configs
        ├── helpers.ts    # Text processing utilities
        ├── lecithin.ts   # Lecithin source detection
        ├── halal.ts      # Halal analysis engine
        ├── kosher.ts     # Kosher analysis engine
        ├── allergens.ts  # Allergen detection
        ├── zones.ts      # OCR text zone segmentation
        └── ocr.ts        # OpenAI GPT Vision OCR
```

## API Endpoint

### POST /scan

Analyze a food product image for halal/kosher compliance and allergens.

**Request Body:**
```json
{
  "image": "base64-encoded-image-data",
  "profile": {
    "diet": "halal",           // "halal", "kosher", or null
    "allergies": ["soy", "milk"]  // Array of allergen names
  }
}
```

**Response:**
```json
{
  "success": true,
  "detected_language": "es",
  "ocr_source": "gpt_vision",
  "diet_verdict": {
    "halal": {
      "status": "HALAL",
      "confidence": "MEDIUM",
      "reason": "All detected ingredients are verified halal at ingredient level.",
      "failing_ingredients": [],
      "reason_codes": []
    }
  },
  "ingredients": [
    {
      "original": "azúcar",
      "english": "sugar",
      "normalized": "sugar"
    }
  ],
  "analysis": [
    {
      "name": "sugar",
      "original": "azúcar",
      "english": "sugar",
      "halal": {
        "status": "HALAL",
        "confidence": "HIGH",
        "reason_codes": ["inherently_halal_by_nature"],
        "evidence": ["Plant-based ingredient; halal by default"]
      },
      "allergy_flag": false
    }
  ],
  "allergens": ["milk (may contain)"]
}
```

## Deployment

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link to your project

```bash
cd supabase
supabase link --project-ref xnzgmgjuxisclvjvnppy
```

### 4. Set environment secrets

```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

### 5. Deploy the function

```bash
supabase functions deploy scan
```

## Local Development

### 1. Start Supabase locally

```bash
supabase start
```

### 2. Serve functions locally

```bash
supabase functions serve scan --env-file ./functions/.env
```

### 3. Test with curl

```bash
curl -X POST http://localhost:54321/functions/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"image": "base64-encoded-image", "profile": {"diet": "halal"}}'
```

## Features

### Halal Analysis
- Comprehensive E-number detection (always haram, source-dependent, halal)
- Alcohol detection with halal alternatives recognition
- Animal derivatives with source-aware evaluation
- Gelatin source detection (porcine, bovine, fish, halal-certified)
- Lecithin source detection (sunflower, soy, rapeseed, egg)
- Global halal certifier recognition (JAKIM, MUI, IFANCA, HFA, etc.)

### Kosher Analysis
- Forbidden land animals and seafood detection
- Blood and insect-derived ingredient detection
- Grape product supervision requirements
- Source-dependent ingredient handling

### Allergen Detection
- All major allergens (soy, milk, egg, peanut, tree nuts, wheat, fish, shellfish, sesame)
- Lecithin source-aware allergen detection
- "May contain" advisory extraction

### Multi-language Support
- Spanish, English, French, German, Italian ingredient labels
- Intelligent translation with source preservation
- OCR zone segmentation for accurate parsing

## Configuration

All halal/kosher/allergen configuration is embedded in `_shared/config.ts` for fast edge function execution. The configuration includes:

- E-number classifications (400+ entries)
- Alcohol terms and halal alternatives
- Animal derivatives with source variants
- Global halal certifiers (50+ organizations)
- Allergen terms in multiple languages
