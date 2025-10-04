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
  RefreshCw
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

export default function ForgeryDetectionPage() {
  const { userRole, currentUser } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

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
    
    // Simulate analysis process
    setTimeout(() => {
      const mockResult = {
        totalFiles: files.length,
        suspiciousFiles: Math.floor(Math.random() * files.length),
        analysisDetails: files.map(file => ({
          name: file.name,
          suspicious: Math.random() > 0.7,
          confidence: Math.floor(Math.random() * 100),
          issues: Math.random() > 0.7 ? [
            'Metadata inconsistency detected',
            'Compression artifacts suggest editing',
            'Timestamp anomalies found'
          ] : []
        }))
      };
      
      setAnalysisResult(mockResult);
      setIsAnalyzing(false);
    }, 3000);
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
      transition: { duration: 0.6, ease: "easeOut" }
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
                <h1 className="text-2xl font-bold text-white">Forgery Detection</h1>
                <p className="text-gray-400">Analyze files for potential tampering</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

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
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-white/20 hover:border-red-500/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="video/*,audio/*,image/*,.pdf,.doc,.docx"
              />
              
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Drop files here or click to upload
                  </h3>
                  <p className="text-gray-400">
                    Upload video, audio, image, or document files for analysis
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Uploaded Files */}
          {files.length > 0 && (
            <motion.div variants={itemVariants} className="mb-8">
              <div className="glassmorphic-red rounded-2xl p-6 backdrop-blur-xl border border-red-500/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <File className="w-5 h-5 mr-2" />
                  Uploaded Files ({files.length})
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
                    onClick={analyzeFiles}
                    disabled={isAnalyzing}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-red-500/25"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        Analyzing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Analyze Files
                      </div>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <motion.div
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glassmorphic-red rounded-2xl p-6 backdrop-blur-xl border border-red-500/30"
            >
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Analysis Results
              </h3>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-black/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{analysisResult.totalFiles}</p>
                  <p className="text-gray-400 text-sm">Total Files</p>
                </div>
                <div className="p-4 bg-black/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-400">{analysisResult.suspiciousFiles}</p>
                  <p className="text-gray-400 text-sm">Suspicious Files</p>
                </div>
                <div className="p-4 bg-black/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {analysisResult.totalFiles - analysisResult.suspiciousFiles}
                  </p>
                  <p className="text-gray-400 text-sm">Clean Files</p>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-4">
                {analysisResult.analysisDetails.map((detail: any, index: number) => (
                  <div key={index} className="p-4 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{detail.name}</p>
                      <div className="flex items-center space-x-2">
                        {detail.suspicious ? (
                          <div className="flex items-center text-red-400">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">Suspicious</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-green-400">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">Clean</span>
                          </div>
                        )}
                        <span className="text-gray-400 text-sm">
                          {detail.confidence}% confidence
                        </span>
                      </div>
                    </div>
                    
                    {detail.issues.length > 0 && (
                      <div className="mt-2">
                        <p className="text-red-400 text-sm font-medium mb-1">Issues detected:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {detail.issues.map((issue: string, issueIndex: number) => (
                            <li key={issueIndex} className="text-gray-300 text-sm">{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-500/25"
                >
                  <Download className="w-4 h-4 mr-2 inline" />
                  Download Report
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setAnalysisResult(null);
                    setFiles([]);
                  }}
                  className="px-6 py-3 bg-black/20 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2 inline" />
                  Analyze New Files
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
