"use client"; // must be at the top
import React, { useEffect } from "react";
import { useRouter } from "next/navigation"; // correct import for App Router
import { useAuth } from "@/contexts/AuthContext";

export default function AnimatedLoginPage() {
  const router = useRouter(); // now works properly
  const { currentUser } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (currentUser) {
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  const handleLogin = () => {
    router.push("/login"); // replace with your login route
  };

  const handleSignup = () => {
    router.push("/signup"); // replace with your signup route
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      {/* Image Container with hover zoom effect */}
      <div className="mb-12">
        <video
          src="animation.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="max-w-8xl w-230 h-full shadow-5xl transition-transform duration-500 transform hover:scale-105 rounded-2xl"
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
    </div>
  );
}
