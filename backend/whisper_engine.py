import whisper
import os

# ---------------------------------------------------------------------------
# Whisper Engine Utility
# ---------------------------------------------------------------------------

class WhisperEngine:
    def __init__(self, model_name: str = "base"):
        """
        Initialize the Whisper model. 
        'base' is ideal for speed/accuracy balance on most CPUs.
        """
        print(f"[*] Loading Whisper model: {model_name}...")
        self.model = whisper.load_model(model_name)

    def transcribe(self, audio_path: str):
        """
        Transcribe audio with granular word timestamps.
        Returns a list of word objects: {word, start, end}
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        print(f"[*] Transcribing: {audio_path}")
        
        # word_timestamps=True provides the precise start/end for every word
        result = self.model.transcribe(
            audio_path, 
            word_timestamps=True,
            task="transcribe",
            language="en"
        )

        words = []
        for segment in result.get("segments", []):
            for word_info in segment.get("words", []):
                words.append({
                    "word": word_info["word"].strip(),
                    "start": word_info["start"],
                    "end": word_info["end"],
                    "probability": word_info.get("probability", 1.0)
                })

        return words
