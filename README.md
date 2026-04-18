# VOIX

An agent-based interactive presentation system — the slides are the agent's stage, the agent is the presentation's voice.

Multi-project workspace: build slide decks, import PDFs with Vision-structured extraction, let an AI agent narrate them, and let the audience raise hands to interrupt and improvise with the agent in real time. Every Q&A is logged for later curation so the system evolves with each session.

## Stack

- **Frontend** — React + TypeScript + Vite + Tailwind (Genesis-inspired design system)
- **Backend** — Node.js + Express + tsx watch
- **LLM** — OpenAI GPT-4o (Chat + Vision)
- **Voice** — OpenAI Whisper (STT) + `tts-1-hd` (TTS, `onyx` default)
- **State** — Zustand
- **PDF** — client-side `pdfjs-dist` → canvas → PNG → Vision

## Setup

```bash
# 1. Install
npm install
cd client && npm install && cd ..

# 2. Configure
cp .env.example .env
# edit .env and add your OPENAI_API_KEY

# 3. Run (starts server on :3002 and client on :5173)
npm run dev
```

## Key features

- **Projects** — multi-project workspace with auto-save (debounced, per-project folder layout)
- **Agent presence** — slide-overlay canvas orb + full-screen ambient gradient reflect agent state (idle · listening · thinking · acting · confirming · warning)
- **Auto-advance playback** — continuous TTS narration across slides with cancel tokens
- **Raise hand** — NotebookLM-style mid-sentence interrupt; agent improvises with captured narration context
- **PDF → structured slides** — GPT-4o Vision extracts visual hierarchy (headings, bullets, tables, arrows) into Markdown, not flat OCR
- **Insights** — all audience Q&A logged per project, promote good ones to Knowledge so the agent arrives prepared next session
- **Multi-layer slides** — text, images, videos, files, links, topic labels; agent aware of full deck structure

## Project layout

```
presentation-agent/
├── client/                     # Vite React app
│   └── src/
│       ├── components/
│       │   ├── ambient/        # Gradient system (state → visual mapping)
│       │   ├── icons/
│       │   └── …
│       ├── hooks/              # usePlayback, useRaiseHand, useAutoSave, …
│       ├── stores/             # Zustand stores (presentation + projects)
│       ├── utils/              # pdfToImages, pdfToStructuredSlides
│       └── api.ts              # project-scoped API helper
└── server/
    ├── routes/                 # project-scoped routers
    ├── services/               # OpenAI (STT / TTS / GPT / Vision), project management
    └── data/                   # runtime only — git-ignored
        └── projects/<uuid>/
            ├── presentation.json
            ├── qa-log.json
            └── assets/
```
