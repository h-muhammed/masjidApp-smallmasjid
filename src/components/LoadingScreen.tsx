import React from "react";
import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#1E5866] to-[#0d3a45] flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Logo with animation */}
        <div className="relative animate-pulse">
          <Image
            src="/logo.jpg"
            alt="App Logo"
            width={120}
            height={120}
            className="rounded-full border-4 border-yellow-500 shadow-2xl"
            priority
          />
        </div>
        
        {/* App Name */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Ghaneemathul Cassimiya Jumma Mosque
          </h1>
          <p className="text-lg text-white/80">
            Dematagoda Place
          </p>
        </div>
        
        {/* Loading Spinner */}
        <div className="flex items-center justify-center mt-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/20 border-t-yellow-500 rounded-full animate-spin"></div>
          </div>
        </div>
        
        {/* Loading Text */}
        <p className="text-white/70 text-sm animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
