# PoC Wearable AI WebApp - Development Plan

**Version:** 1.0
**Date:** 2025-04-11
**Stack:**
*   **Frontend:** Next.js + Tailwind CSS
*   **Backend:** FastAPI (Python)
*   **Audio Recording:** Web Audio API
*   **Transcription:** OpenAI Whisper API
*   **LLM:** OpenAI API (`gpt-4o` or `gpt-4-turbo`)

---

## 1. Project Setup

*   **Goal:** Initialize project structure and basic configurations.
*   **Tasks:**
    *   Create root project directory (`Wearable`).
    *   Create `client` subdirectory for Next.js frontend.
    *   Create `server` subdirectory for FastAPI backend.
    *   Initialize Next.js project in `client` (`npx create-next-app@latest client --ts --tailwind --eslint --app --src-dir --import-alias "@/*"`).
    *   Initialize FastAPI project structure in `server`:
        *   Create `main.py`.
        *   Create `requirements.txt`.
        *   Create `utils/` directory.
        *   Create `.env` file (and add to `.gitignore`).
    *   Create a root `.gitignore` file (add `.env`, `node_modules`, `__pycache__`, `.venv`, etc.).
    *   Create `README.md` with initial project description.
    *   Save this plan as `PLAN.md` in the root directory.

---

## 2. Backend Development (FastAPI - `/server`)

*   **Goal:** Create the API endpoint to process audio.
*   **Tasks:**
    *   **Environment:**
        *   Define `requirements.txt`: `fastapi`, `uvicorn[standard]`, `python-dotenv`, `openai`, `python-multipart` (for file uploads).
        *   Set up virtual environment (`python -m venv .venv`, `source .venv/bin/activate` or `.\.venv\Scripts\activate`).
        *   Install dependencies (`pip install -r requirements.txt`).
        *   Add `OPENAI_API_KEY` to `.env`.
    *   **API Endpoint (`/process_audio`):**
        *   Create `main.py`.
        *   Implement basic FastAPI app setup.
        *   Load environment variables (`python-dotenv`).
        *   Configure CORS (`fastapi.middleware.cors`) to allow requests from the Next.js frontend (e.g., `http://localhost:3000`).
        *   Define a POST endpoint `/process_audio`.
        *   Accept `UploadFile` (FastAPI's way to handle file uploads) containing the audio data.
        *   Instantiate OpenAI client.
        *   Call OpenAI Whisper API (`client.audio.transcriptions.create`) with the received audio file.
        *   Prepare prompt for LLM using the transcription and predefined context (from `PoC_Wearable_AI_WebApp_Prompt.md`).
        *   Call OpenAI Chat Completions API (`client.chat.completions.create` using `gpt-4o` or similar) with the prompt.
        *   Return a JSON response: `{"transcription": "...", "advice": "..."}`.
        *   Include basic error handling (e.g., API errors).
    *   **Utilities (`/server/utils`):**
        *   (Optional) Create helper functions for OpenAI API calls or configuration loading if logic becomes complex.

---

## 3. Frontend Development (Next.js - `/client`)

*   **Goal:** Build the user interface for recording/uploading audio and displaying results.
*   **Tasks:**
    *   **Core Component (`src/components/AudioProcessor.tsx`):**
        *   Create the main component responsible for interaction.
        *   **UI Elements (Tailwind):**
            *   Button to start/stop recording.
            *   HTML `<input type="file" accept="audio/*">` for uploads.
            *   Visual indicator for recording/processing status.
            *   Area to display the live or final transcription.
            *   Area to display the AI advice (conditionally rendered).
    *   **Audio Handling (Web Audio API):**
        *   Implement function to request microphone access (`navigator.mediaDevices.getUserMedia`).
        *   Use `MediaRecorder` API to capture audio stream.
        *   Store recorded audio chunks.
        *   On stop recording, combine chunks into a `Blob`.
        *   *(Self-Correction: Whisper API often handles various formats directly, but explicitly creating a WAV or MP3 Blob might be safer).* Convert Blob to a suitable format (e.g., WAV using a helper function or library if necessary, though often not needed for direct API calls).
    *   **API Communication:**
        *   Create a function (`sendAudioToServer`) to send the audio `Blob` (from recording or file upload) to the `/process_audio` backend endpoint using `fetch` or `axios`. Use `FormData` to send the file.
        *   Handle the JSON response (`transcription`, `advice`).
        *   Implement loading states during API calls.
    *   **State Management (`useState`, `useEffect`):**
        *   Manage states for: recording status, audio blob/file, transcription text, advice text, loading indicator, error messages.
    *   **Advice Display Logic (Silence Detection - MVP Simulation):**
        *   **MVP Approach:** Display the `advice` after a short, fixed delay (e.g., 2 seconds) once received from the backend, or upon a user action (like clicking a "Show Advice" button that appears).
        *   *(Future Enhancement: Implement basic volume monitoring using Web Audio API's `AnalyserNode` after receiving advice to trigger display during actual perceived pauses.)*
    *   **Styling:** Apply Tailwind CSS classes for layout and styling.
    *   **Page Integration (`src/app/page.tsx`):**
        *   Import and render the `AudioProcessor` component on the main page.

---

## 4. Integration, Testing & Refinement

*   **Goal:** Ensure frontend and backend work together smoothly, add error handling, and refine.
*   **Tasks:**
    *   Run both servers concurrently (FastAPI via `uvicorn main:app --reload` and Next.js via `npm run dev`).
    *   Test the end-to-end flow: Record -> Stop -> Send -> Receive -> Display Transcription -> Display Advice (based on MVP logic).
    *   Test file upload flow.
    *   Implement basic error handling on the frontend (microphone permission denial, API call failures).
    *   Verify CORS configuration allows communication.
    *   Ensure API keys are not exposed in client-side code.
    *   Review and refactor code for clarity and efficiency.
    *   Update `README.md` with detailed setup and run instructions.

---

## 5. Documentation & Deployment (Optional)

*   **Goal:** Finalize documentation and prepare for potential deployment.
*   **Tasks:**
    *   Add code comments where necessary.
    *   Ensure `README.md` is comprehensive.
    *   **(Optional):** Research and document deployment steps for:
        *   Frontend (Next.js): Vercel (recommended), Netlify.
        *   Backend (FastAPI): Render, Fly.io, Heroku, Cloud Run.

---

## 6. Future Enhancements / Potential Next Steps

*   **AI #1 - Advanced Audio Processing:**
    *   Implement explicit noise suppression (e.g., using RNNoise, DeepFilterNet, or similar libraries/models before transcription).
    *   Add speaker diarization (identifying who spoke when).
    *   Implement source separation if multiple audio sources are expected concurrently.
*   **AI #2 - Voice Recognition & Tagging:**
    *   Integrate speaker identification models (e.g., ECAPA-TDNN, x-vector) to recognize and label known users.
    *   Allow users to tag/enroll their voices.
*   **AI #3 - Deeper Conversational/Emotional Understanding:**
    *   Analyze audio directly for tone and emotion (requires different models).
    *   Implement more sophisticated context tracking beyond a static prompt.
*   **AI #4 - Adaptive Advice Generation:**
    *   Develop adaptive LLM prompts based on detected context, mood (work, social, family), or user settings.
    *   Allow user configuration of assistant's personality or focus.
*   **AI #5 - Sophisticated Message Delivery:**
    *   Implement actual silence/pause detection in the audio stream (e.g., using Web Audio API's `AnalyserNode` to monitor volume levels) to time advice delivery accurately (target 3-5s pauses).
    *   For a true wearable simulation, explore text-to-speech (TTS) for audio output instead of text display.

---
