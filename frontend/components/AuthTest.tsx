"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSession, useTokenExpiry } from '@/hooks/useSession';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

export default function AuthTest() {
  const { currentUser, userRole, logout, refreshToken } = useAuth();
  const session = useSession();
  const timeUntilExpiry = useTokenExpiry();
  const [testResults, setTestResults] = useState<Array<{ test: string; status: 'pass' | 'fail' | 'pending' }>>([]);

  const runTests = async () => {
    setTestResults([
      { test: 'User Authentication', status: 'pending' },
      { test: 'Role Assignment', status: 'pending' },
      { test: 'Session Persistence', status: 'pending' },
      { test: 'Token Management', status: 'pending' },
      { test: 'Cookie Storage', status: 'pending' }
    ]);

    // Test 1: User Authentication
    setTimeout(() => {
      setTestResults(prev => prev.map(test => 
        test.test === 'User Authentication' 
          ? { ...test, status: currentUser ? 'pass' : 'fail' }
          : test
      ));
    }, 500);

    // Test 2: Role Assignment
    setTimeout(() => {
      setTestResults(prev => prev.map(test => 
        test.test === 'Role Assignment' 
          ? { ...test, status: userRole ? 'pass' : 'fail' }
          : test
      ));
    }, 1000);

    // Test 3: Session Persistence
    setTimeout(() => {
      setTestResults(prev => prev.map(test => 
        test.test === 'Session Persistence' 
          ? { ...test, status: session.isAuthenticated ? 'pass' : 'fail' }
          : test
      ));
    }, 1500);

    // Test 4: Token Management
    setTimeout(() => {
      setTestResults(prev => prev.map(test => 
        test.test === 'Token Management' 
          ? { ...test, status: timeUntilExpiry && timeUntilExpiry > 0 ? 'pass' : 'fail' }
          : test
      ));
    }, 2000);

    // Test 5: Cookie Storage
    setTimeout(() => {
      const hasCookie = document.cookie.includes('cinehack_auth');
      setTestResults(prev => prev.map(test => 
        test.test === 'Cookie Storage' 
          ? { ...test, status: hasCookie ? 'pass' : 'fail' }
          : test
      ));
    }, 2500);
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending':
        return <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return 'text-green-400';
      case 'fail':
        return 'text-red-400';
      case 'pending':
        return 'text-gray-400';
    }
  };

  if (!currentUser) {
    return (
      <div className="glassmorphic-red rounded-2xl p-6 backdrop-blur-xl border border-red-500/30">
        <h3 className="text-lg font-semibold text-white mb-4">Authentication Test</h3>
        <p className="text-gray-400">Please log in to run authentication tests.</p>
      </div>
    );
  }

  return (
    <div className="glassmorphic-red rounded-2xl p-6 backdrop-blur-xl border border-red-500/30">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Authentication Test</h3>
        <button
          onClick={runTests}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Run Tests
        </button>
      </div>

      {/* Session Info */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">User ID:</span>
            <p className="text-white font-mono text-xs">{currentUser.uid}</p>
          </div>
          <div>
            <span className="text-gray-400">Role:</span>
            <p className="text-white capitalize">{userRole?.role}</p>
          </div>
          <div>
            <span className="text-gray-400">Email:</span>
            <p className="text-white">{userRole?.email}</p>
          </div>
          <div>
            <span className="text-gray-400">Display Name:</span>
            <p className="text-white">{userRole?.displayName || 'N/A'}</p>
          </div>
        </div>

        {/* Token Info */}
        {timeUntilExpiry && (
          <div className="flex items-center space-x-2 p-3 bg-black/20 rounded-lg">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Token expires in:</span>
            <span className="text-white font-medium">
              {Math.floor(timeUntilExpiry / (1000 * 60))} minutes
            </span>
            <button
              onClick={refreshToken}
              className="ml-auto p-1 hover:bg-white/10 rounded transition-colors"
              title="Refresh token"
            >
              <RefreshCw className="w-3 h-3 text-gray-400 hover:text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Test Results:</h4>
          {testResults.map((test, index) => (
            <motion.div
              key={test.test}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-2 bg-black/20 rounded-lg"
            >
              <span className="text-sm text-white">{test.test}</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(test.status)}
                <span className={`text-sm font-medium ${getStatusColor(test.status)}`}>
                  {test.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex space-x-3">
        <button
          onClick={refreshToken}
          className="flex-1 py-2 bg-black/20 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors"
        >
          Refresh Token
        </button>
        <button
          onClick={logout}
          className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
