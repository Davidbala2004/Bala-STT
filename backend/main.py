from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import tempfile
import uvicorn
import logging
import traceback

# Module imports
from whisper_engine import WhisperEngine
from evaluator import ReadingEvaluator

# ---------------------------------------------------------------------------
# Logging System Setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("AIJudge")

# ---------------------------------------------------------------------------
# FastAPI "Judge" Service
# ---------------------------------------------------------------------------

app = FastAPI(title="Sherpa-Judge Evaluation API", version="2.0.1")

# SECURITY: Permissive CORS for Local Testing Phase
logger.info("[STARTUP] Applying Global CORS Policy (origins=[*])")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# ENGINE INITIALIZATION
logger.info("[STARTUP] Initializing Whisper Neural Engine (Base)...")
engine = WhisperEngine(model_name="base")

logger.info("[STARTUP] Initializing Custom Reading Evaluator...")
evaluator = ReadingEvaluator(similarity_threshold=0.6)

@app.post("/evaluate")
async def evaluate_reading(
    audio: UploadFile = File(...),
    expected_text: str = Form(...)
):
    logger.info(f"[HANDSHAKE] Request Received: '{audio.filename}'")
    
    if not audio.filename:
        logger.error("[HANDSHAKE] REJECTED: Filename missing.")
        raise HTTPException(status_code=400, detail="No audio file uploaded.")

    # Generate a temporary path to store the incoming stream
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
        temp_path = temp_audio.name
        try:
            logger.info(f"[*] Stream-writing audio to: {temp_path}")
            shutil.copyfileobj(audio.file, temp_audio)
            
            # Close the file handle explicitly before passing to Whisper
            temp_audio.close()
            
            # Check if file was actually written and has content
            file_size = os.path.getsize(temp_path)
            if file_size == 0:
                logger.error("[PHASE 0] File occupies zero bytes. Transcription aborted.")
                raise HTTPException(status_code=422, detail="Empty audio file provided.")
            
            # --- PHASE 1: WHISPER INFERENCE ---
            logger.info(f"[PHASE 1] Entering Neural Transcription ({file_size} bytes)...")
            try:
                whisper_words = engine.transcribe(temp_path)
                logger.info(f"[PHASE 1] Transcription Complete. {len(whisper_words)} words alignment detected.")
            except Exception as e:
                logger.error(f"[PHASE 1] [CRITICAL] Whisper engine failed: {str(e)}")
                logger.error(traceback.format_exc())
                raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
            
            # --- PHASE 2: EVALUATION ALIGNMENT ---
            logger.info("[PHASE 2] Entering Linguistic Scorecard Alignment...")
            results = evaluator.evaluate(expected_text, whisper_words)
            
            # Metadata injection
            results["filename"] = audio.filename
            
            logger.info("[PHASE 3] [SUCCESS] Evaluation result generated.")
            return results

        except HTTPException as he:
            # Re-raise known errors
            raise he
        except Exception as e:
            logger.error(f"[CRITICAL] Backend Process Crash: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
        
        finally:
            # Lifecycle cleanup (Windows-Safe Implementation)
            if os.path.exists(temp_path):
                try:
                    logger.info(f"[*] Lifecycle: Attempting deletion of temp file: {temp_path}")
                    os.remove(temp_path)
                except Exception as cleanup_err:
                    # [WinError 32] Fail-safe: Log as warning but DO NOT crash the response
                    logger.warning(f"[CLEANUP WARNING] Could not delete temp file '{temp_path}': {str(cleanup_err)}")
                    logger.info("[*] This is likely a temporary Windows file lock from FFmpeg/Whisper. Data flow will continue.")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "judge-api-v2.0.1", "model": "whisper-base"}

if __name__ == "__main__":
    logger.info("[DAEMON] AI Judge Server waking up on Port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
