"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSession, useTokenExpiry } from '@/hooks/useSession';
import AuthTest from '@/components/AuthTest';
import { motion } from 'framer-motion';
import { 
  LogOut, 
  User, 
  Film, 
  Upload, 
  Shield, 
  Settings, 
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, userRole, logout, refreshToken } = useAuth();
  const session = useSession();
  const timeUntilExpiry = useTokenExpiry();
  const router = useRouter();
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
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
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] }
    }
  };

  if (!currentUser || !userRole) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
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
            <h1 className="text-3xl font-bold text-white tracking-wider">
              अनुवाद्य
            </h1>
            <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
              <span className="text-red-400 text-sm font-semibold capitalize">
                {userRole.role}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Session Status */}
            {timeUntilExpiry && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-black/20 border border-white/20 rounded-lg">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm">
                  Session: {Math.floor(timeUntilExpiry / (1000 * 60))}m left
                </span>
                <button
                  onClick={refreshToken}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Refresh token"
                >
                  <RefreshCw className="w-3 h-3 text-gray-400 hover:text-white" />
                </button>
              </div>
            )}
            
            <div className="text-right">
              <p className="text-white font-medium">{userRole.displayName || 'User'}</p>
              <p className="text-gray-400 text-sm">{userRole.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-black/20 border border-white/20 hover:bg-white/10 transition-all duration-300 group"
            >
              <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          {/* Welcome Section */}
          <motion.div variants={itemVariants} className="mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Welcome back, {userRole.displayName || 'User'}!
            </h2>
            <p className="text-gray-400 text-lg">
              {userRole.role === 'production' 
                ? 'Manage your subtitle projects and detect forgery in uploaded files.'
                : 'Create and manage your subtitle projects with ease.'
              }
            </p>
          </motion.div>

          {/* Action Cards */}
          <div className="flex justify-center items-center">
            {/* Create Subtitle Card */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              className="glassmorphic-red rounded-2xl p-6 backdrop-blur-xl border border-red-500/30 cursor-pointer group"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-500/20 rounded-lg mr-4">
                  <Plus className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Create Subtitle</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Upload your video file and generate subtitles automatically.
              </p>
              <div className="flex items-center text-red-400 text-sm font-medium group-hover:text-red-300 transition-colors"
                 onClick={() => router.push('/upload')}
              >
                Start Creating
                <motion.div
                  className="ml-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.div>
              </div>
            </motion.div>

            {/* Production-specific features */}
            {userRole.role === 'production' && (
              <>
                {/* Forgery Detection Card */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  onClick={() => router.push('/forgery-detection')}
                  className="glassmorphic-red rounded-2xl p-6 backdrop-blur-xl border border-red-500/30 cursor-pointer group"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-red-500/20 rounded-lg mr-4">
                      <Shield className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Forgery Detection</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Upload files to detect potential forgery and tampering.
                  </p>
                  <div className="flex items-center text-red-400 text-sm font-medium group-hover:text-red-300 transition-colors">
                    Detect Forgery
                    <motion.div
                      className="ml-2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.div>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
