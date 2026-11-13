# VeriLex

**A voice AI guardian for conversations about contracts and offers.** VeriLex compares spoken promises with written terms and surfaces discrepancies while the conversation is happening.

VeriLex is an early-stage prototype. The frontend includes a scripted demo; live listening uses a FastAPI relay for Gnani speech recognition and speech synthesis. The current live session sends document facts as JSON. PDF clause extraction and persistent session storage are not wired into the live backend yet.

## Product screenshots

### Why VeriLex

![VeriLex product overview](screen%20shot/why%20verilex.png)

### How it works

![VeriLex workflow](screen%20shot/how%20it%20works.png)

### AI models

![VeriLex AI model pipeline](screen%20shot/models.png)

### Evidence report

![VeriLex sample evidence report](screen%20shot/final%20report.png)

## What it does

- Streams conversation audio to Gnani Prisma v2.5 for speech recognition.
- Detects spoken commitments and compares supported claims with document facts.
- Sends a short voice warning through Gnani Timbre v2.5 when a high or medium severity contradiction is found.
- Supports an optional OpenAI-compatible Evon endpoint for commitment extraction and verification, with a rule-based fallback.
- Keeps a scripted Demo mode available without connecting to the live backend.

The prototype is decision support, not legal advice. Review the source document and seek qualified advice for important decisions.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| Speech | Gnani Prisma v2.5 STT and Timbre v2.5 TTS |
| Optional reasoning | Evon through an OpenAI-compatible chat completions API |

## Run the frontend

Requirements: Node.js and pnpm. The repository declares pnpm as its package manager.

```bash
corepack pnpm install
cp .env.local.example .env.local
corepack pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Demo mode is enabled by default and does not require backend credentials.

### Enable live mode

Run the backend as described in [`backend/README.md`](backend/README.md). In the root `.env.local`, set:

```dotenv
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_BACKEND_WS_URL=ws://localhost:8000/ws/session
```

Restart the frontend after changing environment variables. The browser will request microphone access when the live session opens. For a deployed HTTPS frontend, configure a `wss://` backend URL and add the frontend origin to the backend's `FRONTEND_ORIGINS` setting.

## Run the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `GNANI_API_KEY` in `backend/.env` on your machine, then start the API:

```bash
uvicorn main:app --reload --port 8000
```

The backend `.env` is ignored by Git. Keep Gnani and Evon credentials on the backend; never put API keys in frontend variables, source files, or screenshots.

The backend provides:

- `GET /health` for service and credential-presence status.
- `POST /api/tts` for generated WAV audio.
- `GET /api/tts-check` and `POST /api/test-warning` for TTS diagnostics.
- `WS /ws/session` for the live audio session.

See [`backend/README.md`](backend/README.md) for configuration, API examples, clip generation, and deployment details.

## Development checks

```bash
corepack pnpm build
```

The FastAPI service can be checked locally at `http://localhost:8000/health` after it starts. Live speech and TTS checks require a valid backend API key and available Gnani service access.

## Repository layout

```text
app/                 Next.js pages and routes
components/          Shared interface components
lib/                 Frontend API and live socket helpers
backend/             FastAPI application and Gnani integration
public/              Static assets and audio worklet
screen shot/         Product screenshots used above
```
