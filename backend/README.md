# PureMark Backend - FastAPI

AI-powered ingredient analysis API for Halal/Kosher compliance.

## Tech Stack

- **Framework**: FastAPI
- **AI/OCR**: OpenAI GPT-4o Vision
- **Deployment**: Railway

## Local Development

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run development server
uvicorn main:app --reload --port 8000
```

API will be available at: http://localhost:8000

## API Endpoints

### Health Check
```
GET /health
```

### Scan Ingredients
```
POST /scan
Content-Type: application/json

{
  "image": "base64-encoded-image",
  "profile": {
    "diet": "halal",  // or "kosher"
    "allergies": ["peanuts", "milk"]
  }
}
```

## Railway Deployment

### 1. Create Railway Account
Go to [railway.app](https://railway.app) and sign up.

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Connect your repository

### 3. Configure Root Directory
In Railway dashboard:
- Go to Settings > Root Directory
- Set to: `backend`

### 4. Add Environment Variables
In Railway dashboard, add:
- `OPENAI_API_KEY`: Your OpenAI API key
- `ANTHROPIC_API_KEY`: (Optional) Your Anthropic API key

### 5. Deploy
Railway will automatically deploy when you push to main.

### 6. Get Your URL
After deployment, Railway will give you a URL like:
`https://puremark-backend-production.up.railway.app`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4o Vision |
| `ANTHROPIC_API_KEY` | No | Anthropic API key for Claude |
| `PORT` | No | Server port (Railway sets this) |

## Project Structure

```
backend/
├── main.py              # FastAPI app & endpoints
├── services/
│   ├── ocr.py          # GPT-4o Vision OCR
│   ├── zones.py        # Text segmentation
│   ├── halal.py        # Halal analysis engine
│   ├── kosher.py       # Kosher analysis engine
│   ├── allergens.py    # Allergen detection
│   ├── lecithin.py     # Lecithin source detection
│   ├── config.py       # E-numbers & configuration
│   └── helpers.py      # Utility functions
├── requirements.txt     # Python dependencies
├── Procfile            # Railway/Heroku process file
├── railway.json        # Railway configuration
└── .env.example        # Environment template
```

## Cost Estimate

| Service | Cost |
|---------|------|
| Railway | $5-20/month (usage-based) |
| OpenAI API | ~$0.01-0.05 per scan |

**Total**: ~$5-25/month for typical usage
