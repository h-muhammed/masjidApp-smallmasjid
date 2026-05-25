import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { logout } from "@/utils/auth";
import { masjidConfig } from "@/config/masjid";
import { useGetPendingRegistrationCount } from "@/api/registrationApi";

export default function Navbar() {
  const router = useRouter();
  const { data: pendingCount = 0 } = useGetPendingRegistrationCount();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unknown error occurred");
      }
    }
  };

  return (
    <header
      className="sticky top-0 z-40 shadow-sm"
      style={{ backgroundColor: masjidConfig.primaryColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <Image
              src={masjidConfig.logoPath}
              alt={`${masjidConfig.name} logo`}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border-2 border-white/30 shrink-0"
            />
            <div className="min-w-0 hidden sm:block">
              <p className="text-white font-semibold text-sm leading-tight truncate">
                {masjidConfig.name}
              </p>
              {masjidConfig.tagline ? (
                <p className="text-white/75 text-xs truncate">
                  {masjidConfig.tagline}
                </p>
              ) : null}
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/registrations"
              className="relative px-3 py-2 text-sm font-medium text-white/90 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
            >
              Registrations
              {pendingCount > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              ) : null}
            </Link>
            <button
              onClick={handleLogout}
              className="shrink-0 px-4 py-2 text-sm font-medium text-white/90 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
