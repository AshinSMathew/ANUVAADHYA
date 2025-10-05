# ANUVAADHYA - AI-Powered Multilingual Subtitle Generator

ANUVAADHYA is an innovative web application that leverages cutting-edge AI technologies to generate accurate multilingual subtitles for audio and video content. This project combines multiple AI APIs with a modern full-stack architecture to create a powerful tool for content localization and accessibility.

# Project Overview
- ANUVAADHYA addresses the growing need for content accessibility and localization by providing:
- Automatic speech-to-text transcription
- Multilingual translation capabilities
- Real-time subtitle generation
- User-friendly dashboard for project management
- Secure authentication system
- Audio/video file upload and processing

# Technology Stack
## Frontend
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- React Context for state management
- Custom Hooks for reusable logic

## Backend
- Python with audio processing capabilities
- Firebase for authentication and data storage
- Multiple AI APIs for comprehensive subtitle generation

### AI Integration
- Sarvam AI API - Indian language speech recognition and translation
- Whisper - International language speech recognition and translation
- Google Gemini API - Advanced AI processing and text refinement
- Firebase - Backend services and authentication

# Project Structure
```bash
ANUVAADHYA/
├── app/                         # Next.js frontend application
│   ├── dashboard/               # User dashboard page
│   ├── forgery-detection/       # MAIN SUBTITLE GENERATION INTERFACE
│   ├── login/                   # Authentication page
│   ├── player/                  # Media player with subtitle support
│   ├── signup/                  # User registration
│   ├── upload/                  # File upload interface
│   ├── components/              # Reusable React components
│   │   ├── SubtitleEditor/      # Subtitle editing interface
│   │   ├── LanguageSelector/    # Multi-language selection
│   │   ├── ProgressTracker/     # Generation progress
│   │   └── ExportOptions/       # Subtitle export formats
│   ├── contexts/                # React context providers
│   │   ├── SubtitleContext/     # Subtitle management
│   │   ├── LanguageContext/     # Language preferences
│   │   └── AuthContext/         # User authentication
│   ├── hooks/                   # Custom React hooks
│   │   ├── useSubtitleGenerator/
│   │   ├── useLanguageProcessing/
│   │   └── useMediaPlayer/
│   ├── lib/                     # Utility libraries
│   │   ├── srt-parser/          # SRT file handling
│   │   ├── language-codes/      # Language support
│   │   └── api-client/          # API communication
│   ├── public/                  # Static assets
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── backend/                     # Python backend services
│   ├── finger.py               # Audio processing & subtitle generation
│   ├── test.py                 # Testing utilities
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Environment variables
└── configuration files         # Project configuration
```

# Installation & Setup
### Prerequisites
- Node.js 18+
- Python 3.8+
- npm

### API keys:
-Sarvam AI
-Google Gemini
-Firebase

## Frontend Setup
#### Navigate to the app directory

```bash
cd frontend
```

#### Install dependencies
```bash
npm install
```
#### Environment Configuration
Create `.env.local` file with:
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Run the development server
```bash
npm run dev
```

## Backend Setup
#### Navigate to the backend directory

```bash
cd backend
```
#### Create virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Install Python dependencies
```bash
pip install -r requirements.txt
```
#### Environment Configuration
Create `.env` file with:
```bash
# API Keys
SARVAM_API_KEY=your_sarvam_api_key
GEMINI_API_KEY=your_gemini_api_key
```
#### Run the backend server

```bash
python test.py
```

---

# Key Features
1. Multilingual Subtitle Generation
- Automatic speech recognition for multiple languages
- Real-time translation between supported languages
- Accurate timestamp synchronization
- Support for Indian regional languages via Sarvam AI

2. Supported Languages
- All languages

3. Media Processing
- Audio file support: WAV, MP3, M4A, FLAC, AAC
- Video file support: MP4, AVI, MOV, MKV
- Batch processing for multiple files
- Progress tracking during generation

4. Subtitle Management
- Real-time subtitle editor
- Timeline synchronization
- Multiple export formats (SRT, VTT, TXT)
- Translation memory for consistency

5. User Dashboard
- Project history and management
- Processing statistics
- Quick access to recent files
- Export management

--- 

# Usage Guide
1. User Registration & Login
- Create account with email/password
- Secure authentication via Firebase
- Profile management

2. File Upload
- Navigate to upload section
- Drag and drop or select media files
- Supported formats: audio/video files up to 100MB

3. Subtitle Generation Process
- Select source language of the media
- Choose target languages for translation
- Configure generation settings
- Monitor real-time progress
- Review and edit generated subtitles

4. Subtitle Editing
- Timeline adjustment for perfect sync
- Text editing for accuracy
- Multi-language preview
- Real-time saving

5. Export Options
- SRT - Standard subtitle format
- VTT - Web video text tracks