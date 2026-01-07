# PureMark Backend Setup

## Prerequisites

1. **Python 3.8+** installed
2. **OpenAI API Key** with access to `gpt-4o-mini`

## Installation

1. Install Python dependencies:

```powershell
cd PureMark
pip install flask flask-cors openai
```

2. Set your OpenAI API key:

**PowerShell:**
```powershell
$env:OPENAI_API_KEY="sk-your-api-key-here"
```

**Command Prompt:**
```cmd
set OPENAI_API_KEY=sk-your-api-key-here
```

**Or permanently (Windows):**
- Open System Properties > Environment Variables
- Add a new User variable: `OPENAI_API_KEY` = `your-key`

## Running the Backend

```powershell
cd PureMark
python app.py
```

You should see:
```
==============================================
🚀 PUREMARK BACKEND RUNNING
📌 OCR Model: gpt-4o-mini
📌 Health Scoring Model: gpt-4o-mini
📌 Diet Rules: Halal & Kosher only
📌 Server: http://0.0.0.0:5000
==============================================
```

## Connecting from Mobile Device

Your local IP address: `192.168.86.241`

This is already configured in `services/api.ts`.

Make sure your phone and computer are on the **same WiFi network**.

**Windows Firewall:** You may need to allow Python through the firewall:
- Windows Security > Firewall > Allow an app > Add Python

## Testing the Backend

Test if the backend is running:
```powershell
curl http://localhost:5000/health
```

Should return: `{"status":"ok"}`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/scan` | POST | Analyze ingredient image |
| `/save_profile` | POST | Save user preferences |
| `/submit_feedback` | POST | Submit feedback |

## Troubleshooting

### "Connection refused" on mobile
- Verify phone and PC are on same network
- Check Windows Firewall allows Python
- Use your local IP, not `localhost`

### "OpenAI API key not set"
- Make sure the environment variable is set in the **same terminal** running app.py

### "No module named 'flask'"
- Run: `pip install flask flask-cors openai`

