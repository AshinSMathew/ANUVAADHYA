"use client"
import React from 'react';

export default function AnimatedLoginPage() {
  const handleLogin = () => {
    console.log('Login clicked');
  };

  const handleSignup = () => {
    console.log('Signup clicked');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      {/* Image Container with hover zoom effect */}
      <div className="mb-12">
        <img
          src="logo.png"
          alt="Abstract geometric design"
          className="max-w-8xl w-full h-auto shadow-5xl transition-transform duration-500 transform hover:scale-105"
        />
      </div>

      {/* Buttons Container */}
       <div className="flex gap-6">
        <button
          onClick={handleLogin}
          className="px-8 py-3 bg-black text-white font-semibold rounded-lg border-2 border-red-500 shadow-lg hover:shadow-red-500/70 hover:scale-105 transition-all duration-300 transform"
        >
          Login
        </button>
        <button
          onClick={handleSignup}
          className="px-8 py-3 bg-black text-white font-semibold rounded-lg border-2 border-red-500 shadow-lg hover:shadow-red-500/70 hover:scale-105 transition-all duration-300 transform"
        >
          Signup
        </button>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
}