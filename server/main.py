import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI, OpenAIError # Import OpenAIError for exception handling
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Get OpenAI API key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    logger.error("OPENAI_API_KEY environment variable not found.")
    raise ValueError("OPENAI_API_KEY environment variable not set.")

# Initialize OpenAI client
try:
    client = OpenAI(api_key=api_key)
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {e}")
    raise

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3000", # Next.js default dev port
    # Add any other origins if needed (e.g., your deployed frontend URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

@app.post("/process_audio")
async def process_audio(audio_file: UploadFile = File(...)):
    """
    Receives an audio file, transcribes it using Whisper,
    gets advice using a GPT model, and returns both.
    """
    logger.info(f"Received audio file: {audio_file.filename}, Content-Type: {audio_file.content_type}")

    # --- 1. Transcription using Whisper ---
    transcription_text = ""
    try:
        # Read file content for Whisper API
        audio_data = await audio_file.read()
        # Reset file pointer if needed elsewhere, though not necessary here
        # await audio_file.seek(0) 
        
        # Note: Whisper API needs a file-like object or specific parameters.
        # Sending the raw bytes usually requires naming the file within the request.
        # The openai library handles this when passing the UploadFile directly *if* the content type is correctly recognized.
        # Let's pass the file object directly, ensuring it has a name.
        
        # Create a temporary tuple for the file data expected by `files` parameter
        # filename = audio_file.filename or "audio.webm" # Provide a default if filename is None
        # file_tuple = (filename, audio_data, audio_file.content_type or "application/octet-stream")

        # --- Modification Start --- 
        # Ensure filename has an extension. Use the uploaded filename or try to infer. 
        if not audio_file.filename:
            # Attempt to guess extension from content type, default to webm
            content_type = audio_file.content_type
            if content_type == 'audio/mpeg':
                filename_for_api = 'audio.mp3'
            elif content_type == 'audio/wav':
                filename_for_api = 'audio.wav'
            elif content_type == 'audio/ogg':
                filename_for_api = 'audio.ogg'
            elif content_type == 'audio/mp4' or content_type == 'video/mp4': # mp4 audio
                 filename_for_api = 'audio.mp4'
            elif content_type == 'audio/m4a':
                 filename_for_api = 'audio.m4a'
            # Add other common types if needed
            else:
                filename_for_api = 'audio.webm' # Default for recordings or unknown
        else:
            filename_for_api = audio_file.filename

        # Create the tuple expected by the OpenAI library
        file_tuple = (filename_for_api, audio_data, audio_file.content_type)
        
        logger.info(f"Sending audio to Whisper API as tuple: Filename='{filename_for_api}', Content-Type='{audio_file.content_type}'")
        # --- Modification End ---

        # Use the file object directly (ensure it has a name or provide one)
        # Whisper API needs the file object itself for transcription
        transcription_response = client.audio.transcriptions.create(
            model="whisper-1",
            # file=audio_file.file # Pass the underlying file object (Original approach)
            file=file_tuple # Pass the tuple instead
            # file=file_tuple # Alternative if direct file object fails
        )
        transcription_text = transcription_response.text
        logger.info(f"Transcription successful: '{transcription_text[:100]}...'") # Log beginning of transcription

    except OpenAIError as e:
        logger.error(f"OpenAI Whisper API error: {e}")
        raise HTTPException(status_code=500, detail=f"Whisper API error: {e}")
    except Exception as e:
        logger.error(f"Error during transcription: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to transcribe audio: {e}")

    # --- 2. Get Advice using LLM ---
    advice_text = ""
    if transcription_text: # Only proceed if transcription was successful
        try:
            logger.info("Sending transcription to GPT model for advice...")
            # Define the prompt for the LLM (based on PoC requirements)
            system_prompt = "Actúas como un asistente social inteligente. Has escuchado la conversación transcrita del usuario en un entorno de trabajo. Si detectas una oportunidad para ayudarlo a expresarse mejor, calmar tensiones, ser más claro o socialmente hábil, genera una frase corta y útil. Sé empático, proactivo y no invasivo."
            user_message = f"Conversación transcrita:\n\n{transcription_text}\n\n¿Qué consejo sutil podrías ofrecer en este momento?"

            completion_response = client.chat.completions.create(
                model="gpt-4o", # Or "gpt-4-turbo" or other suitable model
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.7, # Adjust for creativity vs. predictability
                max_tokens=100 # Keep advice concise
            )
            advice_text = completion_response.choices[0].message.content.strip()
            logger.info(f"Advice generated: '{advice_text}'")

        except OpenAIError as e:
            logger.error(f"OpenAI Chat Completions API error: {e}")
            # Don't raise exception here, just return empty advice if LLM fails
            advice_text = "Error generating advice from LLM."
        except Exception as e:
            logger.error(f"Error during advice generation: {e}")
            advice_text = "Error generating advice."
    else:
        logger.warning("Skipping advice generation due to empty transcription.")
        advice_text = "Transcription failed, cannot generate advice."


    # --- 3. Return Result ---
    return {"transcription": transcription_text, "advice": advice_text}

# Add a simple root endpoint for testing if the server is running
@app.get("/")
async def root():
    return {"message": "Wearable AI Backend is running"}

# (Optional) Include logic to run with uvicorn if the script is executed directly
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
