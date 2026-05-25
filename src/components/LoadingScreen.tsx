import React from "react";
import Image from "next/image";
import { masjidConfig } from "@/config/masjid";

export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 bg-gradient-to-br flex flex-col items-center justify-center z-50"
      style={{
        backgroundImage: `linear-gradient(to bottom right, ${masjidConfig.primaryColor}, ${masjidConfig.primaryDark})`,
      }}
    >
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative animate-pulse">
          <Image
            src={masjidConfig.logoPath}
            alt={`${masjidConfig.name} logo`}
            width={120}
            height={120}
            className="rounded-full border-4 shadow-2xl"
            style={{ borderColor: masjidConfig.primaryColor }}
            priority
          />
        </div>

        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {masjidConfig.name}
          </h1>
          {masjidConfig.tagline ? (
            <p className="text-lg text-white/80">{masjidConfig.tagline}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-center mt-4">
          <div className="relative">
            <div
              className="w-16 h-16 border-4 border-white/20 rounded-full animate-spin"
              style={{ borderTopColor: masjidConfig.primaryColor }}
            />
          </div>
        </div>

        <p className="text-white/70 text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
