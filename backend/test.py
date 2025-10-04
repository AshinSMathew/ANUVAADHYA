from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from sarvamai import SarvamAI
from dotenv import load_dotenv
from moviepy.editor import VideoFileClip
from deep_translator import GoogleTranslator
import whisper
import os
import json
import tempfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Audio/Video Subtitle Generator")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

# Indian language codes
INDIAN_LANGUAGES = {
    "hi", "bn", "te", "ta", "mr", "ur", "gu", "kn", "ml", "pa", 
    "or", "as", "sa", "sd", "ks", "ne", "si", "my"
}

# Load Whisper model (load once at startup)
WHISPER_MODEL = whisper.load_model("base")

def detect_language(audio_path: str) -> str:
    """
    Detect the primary language of the audio file
    Returns language code (e.g., 'en', 'hi', 'fr', etc.)
    """
    try:
        # Load audio and pad/trim it to fit 30 seconds
        audio = whisper.load_audio(audio_path)
        audio = whisper.pad_or_trim(audio)
        
        # Make log-Mel spectrogram and move to the same device as the model
        mel = whisper.log_mel_spectrogram(audio).to(WHISPER_MODEL.device)
        
        # Detect the spoken language
        _, probs = WHISPER_MODEL.detect_language(mel)
        detected_lang = max(probs, key=probs.get)
        
        logger.info(f"Detected language: {detected_lang} with probability: {probs[detected_lang]:.2f}")
        return detected_lang
    except Exception as e:
        logger.error(f"Language detection failed: {str(e)}")
        # Default to English if detection fails
        return "en"

def convert_json_to_srt(json_data: dict) -> str:
    """Convert JSON transcript data to SRT subtitle format"""
    entries = json_data["diarized_transcript"]["entries"]
    srt_content = []
    
    for i, entry in enumerate(entries, 1):
        start_time = format_time(entry["start_time_seconds"])
        end_time = format_time(entry["end_time_seconds"])
        transcript = entry["transcript"].strip()
        
        srt_content.append(f"{i}")
        srt_content.append(f"{start_time} --> {end_time}")
        srt_content.append(f"{transcript}")
        srt_content.append("")
    
    return "\n".join(srt_content)

def format_time(seconds: float) -> str:
    """Convert seconds to SRT time format (HH:MM:SS,mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def process_with_sarvam(file_path: str) -> dict:
    """Process audio file with SarvamAI API - Batch Speech-to-Text Translation"""
    with tempfile.TemporaryDirectory() as temp_dir:
        client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
        
        # Create batch STT translation job
        job = client.speech_to_text_translate_job.create_job(
            model="saaras:v2.5",
            with_diarization=True,
            num_speakers=100000000000000,
            prompt="Official meeting"
        )
        
        # Upload and process audio
        job.upload_files(file_paths=[file_path])
        job.start()
        job.wait_until_complete()
        
        if job.is_failed():
            raise Exception("Sarvam AI STT job failed")
        
        # Download to temporary directory
        job.download_outputs(output_dir=temp_dir)
        
        # Find and read JSON file
        json_files = [f for f in os.listdir(temp_dir) if f.endswith('.json')]
        if not json_files:
            raise Exception("No JSON output file found from Sarvam AI")
        
        json_file_path = os.path.join(temp_dir, json_files[0])
        with open(json_file_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        
        return json_data

def process_with_whisper(file_path: str, language: str = None) -> dict:
    """Process audio file with Whisper for non-Indian languages"""
    try:
        # Transcribe audio with Whisper
        result = WHISPER_MODEL.transcribe(
            file_path,
            language=language,
            verbose=False,
            task="transcribe"
        )
        
        # Convert to similar format as Sarvam output for consistency
        formatted_result = {
            "diarized_transcript": {
                "entries": [
                    {
                        "start_time_seconds": segment["start"],
                        "end_time_seconds": segment["end"],
                        "transcript": segment["text"].strip()
                    }
                    for segment in result["segments"]
                ]
            }
        }
        
        return formatted_result
    except Exception as e:
        logger.error(f"Whisper processing failed: {str(e)}")
        raise Exception(f"Whisper processing failed: {str(e)}")

def translate_srt_content(srt_content: str, target_lang: str) -> str:
    """Translate SRT content to target language"""
    if not srt_content.strip():
        return srt_content
        
    translator = GoogleTranslator(source="auto", target=target_lang)
    
    lines = srt_content.split('\n')
    translated_lines = []
    
    for line in lines:
        if line.strip().isdigit() or "-->" in line or line.strip() == "":
            translated_lines.append(line)
        else:
            try:
                translated_text = translator.translate(line.strip())
                translated_lines.append(translated_text)
            except Exception as e:
                logger.error(f"Error translating line: {line.strip()} - {e}")
                translated_lines.append(line)
    
    return '\n'.join(translated_lines)

def extract_audio_from_video(video_path: str) -> str:
    """Extract audio from video file and return audio file path"""
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio:
        audio_path = temp_audio.name
    
    video = VideoFileClip(video_path)
    video.audio.write_audiofile(audio_path, verbose=False, logger=None)
    video.close()
    
    return audio_path

@app.post("/generate-subtitles")
async def generate_subtitles(
    file: UploadFile = File(...),
    target_language: str = Form(...)
):
    """
    Generate subtitles from audio or video file with automatic language detection
    and translation to target language
    
    Parameters:
    - file: Audio or video file
    - target_language: Language code for translation (e.g., "es", "fr", "de", "hi")
    """
    logger.info(f"Received request - Target language: {target_language}")
    print(f"Target language received: {target_language}")
    
    temp_file_path = None
    temp_audio_path = None
    
    try:
        # Read uploaded file content
        file_content = await file.read()
        
        # Check if it's a video file
        is_video = file.filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'))
        
        if is_video:
            # Create temp video file
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as temp_video:
                temp_video.write(file_content)
                temp_video_path = temp_video.name
            
            # Extract audio from video
            temp_audio_path = extract_audio_from_video(temp_video_path)
            temp_file_path = temp_audio_path
            
            # Cleanup temp video file immediately
            os.unlink(temp_video_path)
            
        else:
            # Create temp audio file directly
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio:
                temp_audio.write(file_content)
                temp_file_path = temp_audio.name
        
        # Detect language
        detected_language = detect_language(temp_file_path)
        logger.info(f"Detected language: {detected_language}")
        
        # Determine which model to use
        use_sarvam = detected_language in INDIAN_LANGUAGES
        
        # Process with appropriate model
        if use_sarvam:
            logger.info("Using Sarvam AI for Indian language processing")
            result = process_with_sarvam(temp_file_path)
        else:
            logger.info("Using Whisper for non-Indian language processing")
            result = process_with_whisper(temp_file_path, detected_language)
        
        # Convert to SRT
        srt_content = convert_json_to_srt(result)
        
        # Translate to target language
        logger.info(f"Translating from {detected_language} to {target_language}")
        srt_content = translate_srt_content(srt_content, target_language)
        
        filename = f"subtitles_{target_language}.srt"
        logger.info(f"Returning subtitles file: {filename}")
        
        return Response(
            content=srt_content,
            media_type="application/x-subrip",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        # Cleanup temp files
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        if temp_audio_path and os.path.exists(temp_audio_path) and temp_audio_path != temp_file_path:
            os.unlink(temp_audio_path)

@app.get("/")
async def root():
    return {"message": "Subtitle Generator API - Upload audio/video to get SRT subtitles with automatic language detection"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)