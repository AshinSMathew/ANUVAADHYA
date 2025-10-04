# fingerprint_server_mem.py
import os
import io
import uuid
import tempfile
import hashlib
from typing import List, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from moviepy.editor import VideoFileClip
import numpy as np
import librosa
from PIL import Image
import imagehash

# ---------- Config ----------
SEGMENT_SECONDS = 5.0
OVERLAP = 0.5
AUDIO_SR = 22050
# ----------------------------

app = FastAPI(title="Fingerprint Demo API (In-Memory)")

# ---------- In-Memory Storage ----------
videos: Dict[str, Dict[str, Any]] = {}   # video_id -> {filename, duration, segments: [...]}
# each segment: {"index","start","end","audio_fp","visual_fp"}

# ---------- Fingerprinting helpers ----------
def audio_fingerprint_from_slice(y_slice: np.ndarray, sr: int = AUDIO_SR) -> str:
    S = librosa.feature.melspectrogram(y=y_slice, sr=sr, n_fft=2048, hop_length=512, n_mels=64)
    S_db = librosa.power_to_db(S, ref=np.max)
    summary = np.round(np.mean(S_db, axis=1), 3)
    h = hashlib.sha1(summary.tobytes()).hexdigest()
    return h

def visual_phash_from_frame(frame: np.ndarray) -> str:
    img = Image.fromarray(frame.astype('uint8'), 'RGB')
    ph = imagehash.phash(img)
    return str(ph)

def extract_audio_and_frames(video_path: str):
    clip = VideoFileClip(video_path)
    duration = clip.duration
    temp_audio_path = video_path + ".wav"
    clip.audio.write_audiofile(temp_audio_path, verbose=False, logger=None)
    y, sr = librosa.load(temp_audio_path, sr=AUDIO_SR, mono=True)
    os.remove(temp_audio_path)
    return clip, duration, y, sr

def compute_segment_fingerprints(video_path: str, segment_seconds=SEGMENT_SECONDS, overlap=OVERLAP):
    clip, duration, y, sr = extract_audio_and_frames(video_path)
    step = segment_seconds * (1 - overlap)
    segments = []
    seg_index = 0
    t = 0.0
    while t < max(0.0, duration - 0.001):
        start = t
        end = min(duration, t + segment_seconds)
        a_start = int(start * sr)
        a_end = int(end * sr)
        y_slice = y[a_start:a_end]
        if len(y_slice) < 2:
            y_slice = np.pad(y_slice, (0, max(0, int(segment_seconds*sr)-len(y_slice))))
        audio_fp = audio_fingerprint_from_slice(y_slice, sr=sr)
        mid = start + (end - start) / 2.0
        try:
            frame = clip.get_frame(mid)
            visual_fp = visual_phash_from_frame(frame)
        except Exception:
            visual_fp = None
        segments.append({
            "index": seg_index,
            "start": float(start),
            "end": float(end),
            "audio_fp": audio_fp,
            "visual_fp": visual_fp
        })
        seg_index += 1
        t += step
    clip.close()
    return duration, segments

# ---------- API Endpoints ----------
@app.post("/upload-reference")
async def upload_reference(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.mp4', '.mkv', '.avi', '.mov', '.webm')):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1])
    content = await file.read()
    tmp.write(content)
    tmp.flush()
    tmp.close()
    video_path = tmp.name

    try:
        vid_id = str(uuid.uuid4())
        duration, segments = compute_segment_fingerprints(video_path)
        videos[vid_id] = {
            "filename": file.filename,
            "duration": duration,
            "segments": segments
        }
        return {
            "video_id": vid_id,
            "filename": file.filename,
            "duration": duration,
            "segments_count": len(segments)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing video: {e}")
    finally:
        if os.path.exists(video_path):
            os.unlink(video_path)

@app.post("/check-video")
async def check_video(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.mp4', '.mkv', '.avi', '.mov', '.webm')):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1])
    content = await file.read()
    tmp.write(content)
    tmp.flush()
    tmp.close()
    video_path = tmp.name

    try:
        duration, test_segments = compute_segment_fingerprints(video_path)
        results = []
        for ref_id, ref_data in videos.items():
            ref_segments = ref_data["segments"]
            matches = []
            for seg in test_segments:
                for ref_seg in ref_segments:
                    if seg["audio_fp"] == ref_seg["audio_fp"]:
                        matches.append({"type": "audio", "upload_seg": seg, "ref_seg": ref_seg})
                    elif seg["visual_fp"] and ref_seg["visual_fp"] and seg["visual_fp"] == ref_seg["visual_fp"]:
                        matches.append({"type": "visual", "upload_seg": seg, "ref_seg": ref_seg})

            if matches:
                results.append({
                    "video_id": ref_id,
                    "filename": ref_data["filename"],
                    "matches_found": len(matches),
                    "examples": matches[:5]  # return only sample evidence
                })
        return {"duration": duration, "segments_checked": len(test_segments), "matches": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking video: {e}")
    finally:
        if os.path.exists(video_path):
            os.unlink(video_path)

@app.get("/videos")
async def get_videos():
    return [{"video_id": vid, "filename": v["filename"], "duration": v["duration"]} for vid, v in videos.items()]

# Run: uvicorn fingerprint_server_mem:app --reload --port 8000
