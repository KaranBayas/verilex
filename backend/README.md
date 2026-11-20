# VeriLex backend

Python 3.10+ FastAPI relay for Gnani Prisma speech recognition and Timbre speech synthesis. The Gnani and optional Evon credentials are read only from this backend's `.env` file; never put them in frontend environment variables.

## Setup and run

```sh
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill `GNANI_API_KEY` in `backend/.env` locally. The other settings have defaults in `.env.example`. `GNANI_TTS_VOICE`, `GNANI_TTS_VOICE_MR`, and `GNANI_TTS_VOICE_EN` select the default, Marathi, and English voices. Then start:

```sh
uvicorn main:app --reload --port 8000
```

The frontend defaults to Demo mode. Set `NEXT_PUBLIC_DEMO_MODE=false` in the frontend's `.env.local` to enable the microphone backend, and set `NEXT_PUBLIC_BACKEND_WS_URL=ws://localhost:8000/ws/session`. `.env.local.example` contains the URL setting. Restart Next.js after changing environment values.

## Check the API

```sh
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/tts \
  -H 'Content-Type: application/json' \
  -d '{"text":"do percent processing fee hai","language":"hi-IN"}' \
  --output test.wav
```

`test.wav` should be playable when Gnani credentials and credits are available. Create reusable demo warning clips with:

```sh
python scripts/generate_whisper_clips.py --language en-IN --voice Nalini
```

The realtime endpoint expects raw mono signed 16-bit little-endian PCM at 16 kHz and relays 1024-byte frames. A real streaming check needs a valid key and audio input. Rule-based pipeline verification can also be run locally with the Python module and does not require a Gnani call.

## Frontend and deployment

Run the frontend from the project root with `npm run dev` (or `pnpm dev`). A frontend deployed over HTTPS, such as Vercel, needs a secure `wss://` backend URL, provided by a host such as Render or a tunnel such as ngrok. Add the deployed frontend URL to `FRONTEND_ORIGINS` in the backend environment.
