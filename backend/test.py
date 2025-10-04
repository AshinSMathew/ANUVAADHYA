from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from sarvamai import SarvamAI
from dotenv import load_dotenv
from moviepy.editor import VideoFileClip
import google.generativeai as genai
import whisper
import os
import json
import tempfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Audio/Video Subtitle Generator with Emotion Detection")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

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

def get_language_name(lang_code: str) -> str:
    """Convert language code to full language name"""
    language_map = {
        "en": "English", "es": "Spanish", "fr": "French", "de": "German",
        "hi": "Hindi", "bn": "Bengali", "te": "Telugu", "ta": "Tamil",
        "mr": "Marathi", "ur": "Urdu", "gu": "Gujarati", "kn": "Kannada",
        "ml": "Malayalam", "pa": "Punjabi", "or": "Odia", "as": "Assamese",
        "it": "Italian", "pt": "Portuguese", "ru": "Russian", "ja": "Japanese",
        "ko": "Korean", "zh": "Chinese", "ar": "Arabic", "tr": "Turkish",
        "nl": "Dutch", "pl": "Polish", "sv": "Swedish", "no": "Norwegian",
        "da": "Danish", "fi": "Finnish", "el": "Greek", "he": "Hebrew",
        "th": "Thai", "vi": "Vietnamese", "id": "Indonesian", "ms": "Malay"
    }
    return language_map.get(lang_code, lang_code.upper())

def translate_srt_with_gemini(srt_content: str, target_lang: str, source_lang: str = "auto") -> str:
    """
    Translate entire SRT file using Gemini API with emotion detection
    Uploads the complete SRT as a file to Gemini
    """
    if not srt_content.strip():
        return srt_content
    
    try:
        # Create a temporary file for the SRT content
        with tempfile.NamedTemporaryFile(mode='w', suffix='.srt', delete=False, encoding='utf-8') as temp_srt:
            temp_srt.write(srt_content)
            temp_srt_path = temp_srt.name
        
        # Upload the file to Gemini
        logger.info(f"Uploading SRT file to Gemini for translation to {target_lang}")
        uploaded_file = genai.upload_file(temp_srt_path, mime_type="text/plain")
        
        # Wait for file to be processed
        import time
        while uploaded_file.state.name == "PROCESSING":
            time.sleep(1)
            uploaded_file = genai.get_file(uploaded_file.name)
        
        if uploaded_file.state.name == "FAILED":
            raise Exception("File upload to Gemini failed")
        
        # Create the model
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",
            generation_config={
                "temperature": 0.3,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
            }
        )
        
        target_language_name = get_language_name(target_lang)
        
        # Create comprehensive prompt for translation with emotion detection
        prompt = f"""You are a professional subtitle translator with expertise in emotion detection and cultural adaptation.

TASK: Translate the attached SRT subtitle file to {target_language_name} and add emotion tags.

INSTRUCTIONS:
1. Maintain the EXACT SRT format (sequence numbers, timestamps, blank lines)
2. Translate ONLY the subtitle text to {target_language_name}
3. Add emotion tags at the START of each subtitle line in square brackets
4. Analyze the emotional tone from context, word choice, punctuation, and content
5. Preserve line breaks within subtitles
6. Keep timestamps exactly as they are (do not modify)
7. Ensure natural, culturally appropriate translations

EMOTION TAGS TO USE:
[neutral] - normal, factual statements
[happy] - joy, excitement, laughter, positive emotions
[sad] - sorrow, grief, melancholy, disappointment
[angry] - rage, frustration, irritation, annoyance
[surprised] - shock, astonishment, disbelief
[fearful] - scared, anxious, worried, terrified
[disgusted] - repulsion, contempt, distaste
[confused] - puzzled, uncertain, questioning
[excited] - enthusiasm, eagerness, anticipation
[calm] - peaceful, relaxed, serene
[sarcastic] - irony, mockery, cynicism
[serious] - grave, stern, solemn
[playful] - teasing, joking, lighthearted
[romantic] - loving, affectionate, tender
[apologetic] - regretful, sorry, remorseful
[grateful] - thankful, appreciative
[proud] - satisfied, accomplished, boastful
[concerned] - worried, caring, attentive
[hopeful] - optimistic, expectant
[frustrated] - exasperated, annoyed

EMOTION TAG PLACEMENT:
- Place emotion tag at the very beginning of the translated text
- Format: [emotion] Translated text here
- Example: [happy] This is wonderful news!

OUTPUT FORMAT:
Return ONLY the complete SRT content with translations and emotion tags. No explanations, no additional text.

Example format:
1
00:00:01,000 --> 00:00:03,500
[happy] Your translated text here

2
00:00:03,500 --> 00:00:06,000
[serious] Another translated line

Now translate the attached SRT file."""

        # Generate response
        logger.info("Generating translation with Gemini...")
        response = model.generate_content([uploaded_file, prompt])
        
        # Clean up temporary file and uploaded file
        os.unlink(temp_srt_path)
        genai.delete_file(uploaded_file.name)
        
        translated_content = response.text.strip()
        
        # Validate the response has SRT structure
        if "-->" not in translated_content:
            raise Exception("Gemini response does not contain valid SRT format")
        
        logger.info("Translation with emotions completed successfully")
        return translated_content
        
    except Exception as e:
        logger.error(f"Gemini translation failed: {str(e)}")
        # Clean up on error
        if 'temp_srt_path' in locals() and os.path.exists(temp_srt_path):
            os.unlink(temp_srt_path)
        if 'uploaded_file' in locals():
            try:
                genai.delete_file(uploaded_file.name)
            except:
                pass
        raise Exception(f"Gemini translation failed: {str(e)}")

def extract_audio_from_video(video_path: str) -> str:
    """Extract audio from video file and return audio file path"""
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio:
        audio_path = temp_audio.name
    
    try:
        video = VideoFileClip(video_path)
        video.audio.write_audiofile(audio_path, verbose=False, logger=None)
        video.close()
        return audio_path
    except Exception as e:
        logger.error(f"Audio extraction failed: {str(e)}")
        if os.path.exists(audio_path):
            os.unlink(audio_path)
        raise Exception(f"Audio extraction failed: {str(e)}")

@app.post("/generate-subtitles")
async def generate_subtitles(
    file: UploadFile = File(...),
    target_language: str = Form(...)
):
    """
    Generate subtitles from audio or video file with automatic language detection,
    translation to target language, and emotion detection using Gemini AI
    
    Parameters:
    - file: Audio or video file (mp3, wav, mp4, avi, mov, mkv, etc.)
    - target_language: Language code for translation (e.g., "es", "fr", "de", "hi", "en")
    
    Returns:
    - SRT subtitle file with translations and emotion tags
    """
    logger.info(f"Received request - Target language: {target_language}")
    
    temp_file_path = None
    temp_audio_path = None
    temp_video_path = None
    
    try:
        # Validate Gemini API key
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured in .env file")
        
        # Read uploaded file content
        file_content = await file.read()
        
        # Check if it's a video file
        is_video = file.filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v'))
        
        if is_video:
            logger.info(f"Processing video file: {file.filename}")
            # Create temp video file
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as temp_video:
                temp_video.write(file_content)
                temp_video_path = temp_video.name
            
            # Extract audio from video
            logger.info("Extracting audio from video...")
            temp_audio_path = extract_audio_from_video(temp_video_path)
            temp_file_path = temp_audio_path
            
            # Cleanup temp video file
            os.unlink(temp_video_path)
            temp_video_path = None
        else:
            logger.info(f"Processing audio file: {file.filename}")
            # Create temp audio file directly
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio:
                temp_audio.write(file_content)
                temp_file_path = temp_audio.name
        
        # Detect language
        logger.info("Detecting audio language...")
        detected_language = detect_language(temp_file_path)
        logger.info(f"Detected language: {detected_language}")
        
        # Determine which model to use
        use_sarvam = detected_language in INDIAN_LANGUAGES
        
        # Process with appropriate model
        if use_sarvam:
            logger.info("Using Sarvam AI for Indian language transcription")
            result = process_with_sarvam(temp_file_path)
        else:
            logger.info("Using Whisper for transcription")
            result = process_with_whisper(temp_file_path, detected_language)
        
        # Convert to SRT
        logger.info("Converting to SRT format...")
        srt_content = convert_json_to_srt(result)
        
        # Translate to target language with emotion detection using Gemini
        logger.info(f"Translating from {detected_language} to {target_language} with emotion detection...")
        translated_srt = translate_srt_with_gemini(srt_content, target_language, detected_language)
        
        filename = f"subtitles_{target_language}_with_emotions.srt"
        logger.info(f"Successfully generated subtitles: {filename}")
        
        return Response(
            content=translated_srt,
            media_type="application/x-subrip",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "X-Source-Language": detected_language,
                "X-Target-Language": target_language
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        # Cleanup temp files
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        if temp_audio_path and temp_audio_path != temp_file_path and os.path.exists(temp_audio_path):
            os.unlink(temp_audio_path)
        if temp_video_path and os.path.exists(temp_video_path):
            os.unlink(temp_video_path)

@app.get("/")
async def root():
    return {
        "message": "Subtitle Generator API with Emotion Detection",
        "description": "Upload audio/video to get SRT subtitles with automatic language detection, translation, and emotion tags",
        "features": [
            "Automatic language detection",
            "Support for Indian languages (Sarvam AI) and global languages (Whisper)",
            "Translation to any language using Gemini AI",
            "Emotion detection and tagging",
            "Support for audio and video files"
        ],
        "endpoint": "/generate-subtitles",
        "supported_emotions": [
            "neutral", "happy", "sad", "angry", "surprised", "fearful",
            "disgusted", "confused", "excited", "calm", "sarcastic",
            "serious", "playful", "romantic", "apologetic", "grateful",
            "proud", "concerned", "hopeful", "frustrated"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "gemini_configured": bool(GEMINI_API_KEY),
        "sarvam_configured": bool(SARVAM_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)