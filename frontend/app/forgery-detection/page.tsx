"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft, 
  Upload, 
  File, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Download,
  Eye,
  RefreshCw,
  Database
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

interface AnalysisResult {
  match_found: boolean;
  message: string;
  matched_video_id?: number;
  title?: string;
  file_path?: string;
  similarity_ratio?: number;
  audio_matches?: number;
  visual_matches?: number;
}

interface IngestionResult {
  status: string;
  video_id: number;
  duration: number;
  audio_hashes: number;
  visual_hashes: number;
}

export default function ForgeryDetectionPage() {
  const { userRole, currentUser } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [mode, setMode] = useState<'detection' | 'ingestion'>('detection');
  const [videoTitle, setVideoTitle] = useState('');

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
  }, []);

  // Redirect if not production user
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (userRole?.role !== 'production') {
      router.push('/dashboard');
    }
  }, [currentUser, userRole, router]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const analyzeFiles = async () => {
    if (files.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('file', files[0].file);

      const response = await fetch('http://localhost:5000/query', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisResult({
        match_found: false,
        message: 'Analysis failed. Please try again.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const ingestVideo = async () => {
    if (files.length === 0 || !videoTitle.trim()) {
      alert('Please provide a video title and select a file');
      return;
    }
    
    setIsIngesting(true);
    setIngestionResult(null);

    try {
      const formData = new FormData();
      formData.append('file', files[0].file);
      formData.append('title', videoTitle);

      const response = await fetch('http://localhost:5000/ingest', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: IngestionResult = await response.json();
      setIngestionResult(result);
    } catch (error) {
      console.error('Ingestion failed:', error);
      alert('Ingestion failed. Please try again.');
    } finally {
      setIsIngesting(false);
    }
  };

  const resetForm = () => {
    setFiles([]);
    setAnalysisResult(null);
    setIngestionResult(null);
    setVideoTitle('');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  return (
    <ProtectedRoute requiredRole="production">
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
          
          {/* Animated Grid Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(255,255,255,0.1)_49%,rgba(255,255,255,0.1)_51%,transparent_52%)] bg-[length:20px_20px] animate-pulse" />
          </div>

          {/* Floating Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-1 h-1 bg-red-500 rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 3,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}

          {/* Red Glow Effect */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 p-6 border-b border-white/10"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-lg bg-black/20 border border-white/20 hover:bg-white/10 transition-all duration-300 group"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
              </button>
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-red-500" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Anti-Piracy Protection</h1>
                  <p className="text-gray-400">Detect and prevent content piracy</p>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Mode Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 p-6"
        >
          <div className="max-w-6xl mx-auto">
            <div className="glassmorphic-red rounded-2xl p-6 backdrop-blur-xl border border-red-500/30 mb-8">
              <div className="flex space-x-4">
                <button
                  onClick={() => setMode('detection')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    mode === 'detection'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                      : 'bg-black/20 text-gray-400 hover:text-white border border-white/20'
                  }`}
                >
                  <Shield className="w-5 h-5 inline mr-2" />
                  Piracy Detection
                </button>
                <button
                  onClick={() => setMode('ingestion')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    mode === 'ingestion'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-black/20 text-gray-400 hover:text-white border border-white/20'
                  }`}
                >
                  <Database className="w-5 h-5 inline mr-2" />
                  Content Ingestion
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="relative z-10 p-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto"
          >
            {/* Upload Area */}
            <motion.div variants={itemVariants} className="mb-8">
              <div
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  dragActive
                    ? mode === 'detection' ? 'border-red-500 bg-red-500/10' : 'border-blue-500 bg-blue-500/10'
                    : 'border-white/20 hover:border-red-500/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple={false}
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="video/*"
                />
                
                <div className="space-y-4">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                    mode === 'detection' ? 'bg-red-500/20' : 'bg-blue-500/20'
                  }`}>
                    <Upload className={`w-8 h-8 ${
                      mode === 'detection' ? 'text-red-500' : 'text-blue-500'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Drop video file here or click to upload
                    </h3>
                    <p className="text-gray-400">
                      {mode === 'detection' 
                        ? 'Upload a video file to check for piracy' 
                        : 'Upload a video file to add to the protected content database'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Title Input for Ingestion */}
            {mode === 'ingestion' && (
              <motion.div variants={itemVariants} className="mb-6">
                <div className="glassmorphic-red rounded-2xl p-6 backdrop-blur-xl border border-blue-500/30">
                  <label className="block text-white font-medium mb-2">
                    Video Title
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Enter video title for database reference"
                    className="w-full p-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {/* Uploaded Files */}
            {files.length > 0 && (
              <motion.div variants={itemVariants} className="mb-8">
                <div className={`glassmorphic-red rounded-2xl p-6 backdrop-blur-xl border ${
                  mode === 'detection' ? 'border-red-500/30' : 'border-blue-500/30'
                }`}>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <File className="w-5 h-5 mr-2" />
                    Selected File
                  </h3>
                  
                  <div className="space-y-3">
                    {files.map((file) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-black/20 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <File className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-white font-medium">{file.name}</p>
                            <p className="text-gray-400 text-sm">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={mode === 'detection' ? analyzeFiles : ingestVideo}
                      disabled={isAnalyzing || isIngesting || (mode === 'ingestion' && !videoTitle.trim())}
                      className={`flex-1 py-3 font-semibold rounded-lg text-white focus:outline-none focus:ring-2 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                        mode === 'detection'
                          ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500/50 hover:shadow-red-500/25'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500/50 hover:shadow-blue-500/25'
                      }`}
                    >
                      {isAnalyzing || isIngesting ? (
                        <div className="flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                          {mode === 'detection' ? 'Analyzing...' : 'Ingesting...'}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          {mode === 'detection' ? (
                            <>
                              <Shield className="w-5 h-5 mr-2" />
                              Check for Piracy
                            </>
                          ) : (
                            <>
                              <Database className="w-5 h-5 mr-2" />
                              Add to Protected Content
                            </>
                          )}
                        </div>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Analysis Results */}
            {analysisResult && mode === 'detection' && (
              <motion.div
                variants={itemVariants}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glassmorphic-red rounded-2xl p-6 backdrop-blur-xl border border-red-500/30"
              >
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Piracy Detection Results
                </h3>

                {analysisResult.match_found ? (
                  <div className="space-y-6">
                    {/* Alert */}
                    <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <div className="flex items-center text-red-400 mb-2">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        <span className="font-semibold">Potential Piracy Detected!</span>
                      </div>
                      <p className="text-gray-300">
                        Similar content found in the database with {Math.round((analysisResult.similarity_ratio || 0) * 100)}% similarity.
                      </p>
                    </div>

                    {/* Match Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-black/20 rounded-lg">
                        <h4 className="text-white font-medium mb-2">Matched Content</h4>
                        <p className="text-gray-300">Title: {analysisResult.title}</p>
                        <p className="text-gray-300">ID: {analysisResult.matched_video_id}</p>
                      </div>
                      <div className="p-4 bg-black/20 rounded-lg">
                        <h4 className="text-white font-medium mb-2">Detection Metrics</h4>
                        <p className="text-gray-300">Similarity: {Math.round((analysisResult.similarity_ratio || 0) * 100)}%</p>
                        <p className="text-gray-300">Audio Matches: {analysisResult.audio_matches}</p>
                        <p className="text-gray-300">Visual Matches: {analysisResult.visual_matches}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <div className="flex items-center text-green-400 mb-2">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-semibold">No Piracy Detected</span>
                    </div>
                    <p className="text-gray-300">{analysisResult.message}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetForm}
                    className="px-6 py-3 bg-black/20 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300"
                  >
                    <RefreshCw className="w-4 h-4 mr-2 inline" />
                    Analyze New File
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Ingestion Results */}
            {ingestionResult && mode === 'ingestion' && (
              <motion.div
                variants={itemVariants}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glassmorphic-red rounded-2xl p-6 backdrop-blur-xl border border-blue-500/30"
              >
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Content Ingestion Complete
                </h3>

                <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg mb-6">
                  <div className="flex items-center text-green-400 mb-2">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Successfully Added to Database</span>
                  </div>
                  <p className="text-gray-300">
                    Your content has been fingerprinted and added to the protected content database.
                  </p>
                </div>

                {/* Ingestion Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 bg-black/20 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Content Information</h4>
                    <p className="text-gray-300">Video ID: {ingestionResult.video_id}</p>
                    <p className="text-gray-300">Duration: {ingestionResult.duration.toFixed(2)}s</p>
                  </div>
                  <div className="p-4 bg-black/20 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Fingerprint Statistics</h4>
                    <p className="text-gray-300">Audio Hashes: {ingestionResult.audio_hashes}</p>
                    <p className="text-gray-300">Visual Hashes: {ingestionResult.visual_hashes}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetForm}
                    className="px-6 py-3 bg-black/20 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300"
                  >
                    <RefreshCw className="w-4 h-4 mr-2 inline" />
                    Add More Content
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}