from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from sarvamai import SarvamAI
from dotenv import load_dotenv
from moviepy.editor import VideoFileClip
from deep_translator import GoogleTranslator
import os
import json
import tempfile

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
    """Process audio file with SarvamAI API using temporary directory"""
    # Create temporary directory for output
    with tempfile.TemporaryDirectory() as temp_dir:
        client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
        
        job = client.speech_to_text_translate_job.create_job(
            model="saaras:v2.5",
            with_diarization=True,
            num_speakers=10000000000000,
            prompt="Official meeting"
        )
        
        # Upload and process audio
        job.upload_files(file_paths=[file_path])
        job.start()
        job.wait_until_complete()
        
        if job.is_failed():
            raise Exception("STT job failed")
        
        # Download to temporary directory
        job.download_outputs(output_dir=temp_dir)
        
        # Find and read JSON file
        json_files = [f for f in os.listdir(temp_dir) if f.endswith('.json')]
        if not json_files:
            raise Exception("No JSON output file found")
        
        json_file_path = os.path.join(temp_dir, json_files[0])
        with open(json_file_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        
        return json_data

def translate_srt_content(srt_content: str, target_lang: str = "es") -> str:
    """Translate SRT content to target language"""
    translator = GoogleTranslator(source="auto", target=target_lang)
    
    lines = srt_content.split('\n')
    translated_lines = []
    
    for line in lines:
        if line.strip().isdigit() or "-->" in line or line.strip() == "":
            translated_lines.append(line)
        else:
            try:
                translated_text = translator.translate(line.strip())
                translated_lines.append(translated_text + "\n")
            except Exception as e:
                print(f"Error translating line: {line.strip()} - {e}")
                translated_lines.append(line)
    
    return '\n'.join(translated_lines)

@app.post("/generate-subtitles")
async def generate_subtitles(
    file: UploadFile = File(...),
    translate_to: str = "en",  # Default to English, use "none" for no translation
    target_language: str = "es"  # Target language for translation
):
    """
    Generate subtitles from audio or video file with optional translation
    
    Parameters:
    - translate_to: "en" for English subtitles, "target" for translated subtitles, "none" for original language
    - target_language: Language code for translation (e.g., "es", "fr", "de")
    """
    temp_file_path = None
    
    try:
        # Read uploaded file content
        file_content = await file.read()
        
        # Check if it's a video file
        is_video = file.filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv'))
        
        if is_video:
            # Create temp video file
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as temp_video:
                temp_video.write(file_content)
                temp_video_path = temp_video.name
            
            # Convert video to audio
            video = VideoFileClip(temp_video_path)
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio:
                temp_file_path = temp_audio.name
                video.audio.write_audiofile(temp_file_path, verbose=False, logger=None)
            video.close()
            
            # Cleanup temp video file immediately
            os.unlink(temp_video_path)
            
        else:
            # Create temp audio file directly
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio:
                temp_audio.write(file_content)
                temp_file_path = temp_audio.name
        
        # Process with SarvamAI
        result = process_with_sarvam(temp_file_path)
        
        # Convert to SRT
        srt_content = convert_json_to_srt(result)
        
        # Handle translation options
        filename = "subtitles.srt"
        
        srt_content = translate_srt_content(srt_content, target_language)
        filename = f"subtitles_{target_language}.srt"
        
        return Response(
            content=srt_content,
            media_type="application/x-subrip",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        # Cleanup temp file
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@app.get("/")
async def root():
    return {"message": "Subtitle Generator API - Upload audio/video to get SRT subtitles"}

@app.get("/supported-languages")
async def supported_languages():
    """Get list of supported translation languages"""
    languages = {
        "es": "Spanish",
        "fr": "French", 
        "de": "German",
        "it": "Italian",
        "pt": "Portuguese",
        "ru": "Russian",
        "ja": "Japanese",
        "ko": "Korean",
        "zh": "Chinese",
        "hi": "Hindi",
        "ar": "Arabic",
        "ml": "Malayalam",
    }
    return languages

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)