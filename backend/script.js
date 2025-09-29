// API base URL - change this to your FastAPI server URL
const API_BASE_URL = 'http://127.0.0.1:8000';

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const generateBtn = document.getElementById('generateBtn');
const languageSelect = document.getElementById('language');
const translateCheckbox = document.getElementById('translate');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const error = document.getElementById('error');
const downloadBtn = document.getElementById('downloadBtn');
const previewContent = document.getElementById('previewContent');

let selectedFile = null;
let generatedSrtContent = '';

// Event listeners
fileInput.addEventListener('change', handleFileSelect);
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
generateBtn.addEventListener('click', generateSubtitles);
downloadBtn.addEventListener('click', downloadSrt);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const file = event.dataTransfer.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    // Validate file type
    const allowedTypes = [
        'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav',
        'video/mp4', 'video/avi', 'video/mkv', 'video/quicktime'
    ];
    
    if (!allowedTypes.includes(file.type)) {
        showError('Please select a valid audio or video file (MP3, WAV, MP4, AVI, MKV, etc.)');
        return;
    }
    
    selectedFile = file;
    fileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
    fileInfo.style.display = 'block';
    generateBtn.disabled = false;
    
    hideResult();
    hideError();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function generateSubtitles() {
    if (!selectedFile) return;
    
    showLoading();
    hideResult();
    hideError();
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    const targetLanguage = languageSelect.value;
    const translateSubtitles = translateCheckbox.checked;
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate-subtitles?target_language=${targetLanguage}&translate_subtitles=${translateSubtitles}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || `Server error: ${response.status}`);
        }
        
        generatedSrtContent = await response.text();
        
        // Show preview (first 10 lines)
        const previewLines = generatedSrtContent.split('\n').slice(0, 10).join('\n');
        previewContent.value = previewLines + (generatedSrtContent.split('\n').length > 10 ? '\n...' : '');
        
        showResult();
        
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
}

function downloadSrt() {
    if (!generatedSrtContent) return;
    
    const targetLanguage = languageSelect.value;
    const blob = new Blob([generatedSrtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${targetLanguage}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showLoading() {
    loading.style.display = 'block';
    generateBtn.disabled = true;
}

function hideLoading() {
    loading.style.display = 'none';
    generateBtn.disabled = false;
}

function showResult() {
    result.style.display = 'block';
}

function hideResult() {
    result.style.display = 'none';
}

function showError(message) {
    error.style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

function hideError() {
    error.style.display = 'none';
}

// Initialize
console.log('Subtitle Translator Frontend Loaded');
console.log('Make sure your FastAPI server is running on:', API_BASE_URL);