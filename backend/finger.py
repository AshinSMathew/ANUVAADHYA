import os
import cv2
import librosa
import numpy as np
import hashlib
import sqlite3
import tempfile
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import imagehash

# ================= CONFIGURATION =================
DB_PATH = "anti_piracy.db"
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Similarity threshold: min fraction of hashes that must match to trigger a hit
SIMILARITY_THRESHOLD = 0.15  

# ================= FASTAPI SETUP =================
app = FastAPI(
    title="Anti-Piracy Content Protection",
    description="Detect pirated content using audio-visual fingerprinting",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DATABASE =================
def create_tables():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT,
        title TEXT,
        duration REAL
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS audio_hashes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER,
        hash TEXT,
        time REAL,
        FOREIGN KEY(video_id) REFERENCES videos(id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS visual_hashes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER,
        hash TEXT,
        frame INTEGER,
        FOREIGN KEY(video_id) REFERENCES videos(id)
    )''')
    conn.commit()
    conn.close()

@app.on_event("startup")
def startup_event():
    create_tables()

# ================= HELPER FUNCTIONS =================
def insert_video(file_path, title, duration):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO videos (file_path, title, duration) VALUES (?, ?, ?)",
              (file_path, title, duration))
    vid = c.lastrowid
    conn.commit()
    conn.close()
    return vid

def insert_audio_hash(video_id, h, t):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO audio_hashes (video_id, hash, time) VALUES (?, ?, ?)",
              (video_id, str(h), t))
    conn.commit()
    conn.close()

def insert_visual_hash(video_id, h, f):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO visual_hashes (video_id, hash, frame) VALUES (?, ?, ?)",
              (video_id, str(h), f))
    conn.commit()
    conn.close()

# ================= AUDIO FINGERPRINT =================
def audio_fingerprint(file_path):
    """Robust audio fingerprint using chroma + spectral contrast features."""
    y, sr = librosa.load(file_path, sr=22050)
    hop = sr // 2  # half-second windows
    duration = librosa.get_duration(y=y, sr=sr)
    hashes = []
    for i in range(0, len(y), hop):
        seg = y[i:i+hop]
        if len(seg) == 0 or np.mean(np.abs(seg)) < 0.01:
            continue
        chroma = librosa.feature.chroma_stft(y=seg, sr=sr)
        spec = librosa.feature.spectral_contrast(y=seg, sr=sr)
        feature_vec = np.concatenate([np.mean(chroma, axis=1), np.mean(spec, axis=1)])
        h = hashlib.sha1(feature_vec.tobytes()).hexdigest()
        hashes.append((h, i / sr))
    return hashes, duration

# ================= VISUAL FINGERPRINT =================
def video_fingerprint(file_path, frame_skip=15):
    """Perceptual hash (phash) of frames at interval frame_skip."""
    cap = cv2.VideoCapture(file_path)
    frame_idx = 0
    hashes = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % frame_skip == 0:
            pil_frame = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            h = str(imagehash.phash(pil_frame))
            hashes.append((h, frame_idx))
        frame_idx += 1
    cap.release()
    return hashes

# ================= QUERY FUNCTIONS =================
def query_audio_hashes(query_hashes):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    results = []
    for h, t in query_hashes:
        c.execute("SELECT video_id FROM audio_hashes WHERE hash = ?", (str(h),))
        matches = c.fetchall()
        for m in matches:
            results.append(m[0])
    conn.close()
    return results

def query_visual_hashes(query_hashes):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    results = []
    for h, f in query_hashes:
        c.execute("SELECT video_id FROM visual_hashes WHERE hash = ?", (str(h),))
        matches = c.fetchall()
        for m in matches:
            results.append(m[0])
    conn.close()
    return results

# ================= FASTAPI ENDPOINTS =================
@app.post("/ingest")
async def ingest_video(file: UploadFile = File(...), title: str = Form("Untitled")):
    """Ingest a new video and store audio-visual fingerprints."""
    temp_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    audio_hashes, duration = audio_fingerprint(temp_path)
    visual_hashes = video_fingerprint(temp_path)
    vid = insert_video(temp_path, title, duration)

    for h, t in audio_hashes:
        insert_audio_hash(vid, h, t)
    for h, f in visual_hashes:
        insert_visual_hash(vid, h, f)

    return {"status": "success", "video_id": vid, "duration": duration,
            "audio_hashes": len(audio_hashes), "visual_hashes": len(visual_hashes)}

@app.post("/query")
async def query_video(file: UploadFile = File(...)):
    """Query uploaded video for pirated content."""
    temp_path = os.path.join(tempfile.gettempdir(), file.filename)
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    q_audio, _ = audio_fingerprint(temp_path)
    q_visual = video_fingerprint(temp_path)

    audio_matches = query_audio_hashes(q_audio) if q_audio else []
    visual_matches = query_visual_hashes(q_visual) if q_visual else []

    if not audio_matches and not visual_matches:
        return {"match_found": False, "message": "No match found."}

    # Count frequency of video IDs
    video_scores = {}
    for vid in audio_matches + visual_matches:
        video_scores[vid] = video_scores.get(vid, 0) + 1

    # Best match
    best_match = max(video_scores, key=video_scores.get)
    total_hashes = max(len(q_audio) + len(q_visual), 1)
    similarity_ratio = video_scores[best_match] / total_hashes

    if similarity_ratio < SIMILARITY_THRESHOLD:
        return {"match_found": False, "message": "No significant match found."}

    # Fetch video info
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT title, file_path FROM videos WHERE id = ?", (best_match,))
    video_info = c.fetchone()
    conn.close()

    return {
        "match_found": True,
        "matched_video_id": best_match,
        "title": video_info[0],
        "file_path": video_info[1],
        "similarity_ratio": similarity_ratio,
        "audio_matches": len(audio_matches),
        "visual_matches": len(visual_matches)
    }

@app.get("/")
def root():
    return {"message": "Anti-Piracy Fingerprinting API Running!"}
