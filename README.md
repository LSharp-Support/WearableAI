# PoC Wearable AI WebApp

A Proof-of-Concept web application simulating a proactive AI assistant integrated into a wearable device.

## Overview

This application allows users to record or upload audio. The audio is then processed:

1.  Transcribed using OpenAI Whisper.
2.  Analyzed by an OpenAI LLM (e.g., GPT-4o) based on the transcription and context.
3.  The LLM generates helpful, subtle advice.
4.  The advice is displayed back to the user, simulating a real-time assistant.

## Tech Stack

*   **Frontend:** Next.js (TypeScript, App Router) + Tailwind CSS
*   **Backend:** FastAPI (Python)
*   **Audio Recording:** Web Audio API
*   **AI Services:** OpenAI API (Whisper, Chat Completions)

## Project Structure

```
/client         # Next.js frontend application
/server         # FastAPI backend application
PLAN.md         # Development plan
README.md       # This file
.gitignore      # Git ignore rules
```

*(Setup and run instructions will be added later)*
