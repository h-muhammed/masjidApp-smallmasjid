import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { logout } from "@/utils/auth";
import { masjidConfig, masjidDisplayName } from "@/config/masjid";

export default function Navbar() {
  const router = useRouter();

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
    <div
      className="navbar mb-2 flex-wrap"
      style={{ backgroundColor: masjidConfig.primaryColor }}
    >
      <div className="flex h-16">
        <Link href="/">
          <Image
            src={masjidConfig.logoPath}
            alt={`${masjidConfig.name} logo`}
            width={48}
            height={48}
            className="h-12 mt-2 ml-2 rounded-full border-2 shadow-sm"
            style={{ borderColor: masjidConfig.accentColor }}
          />
        </Link>
      </div>
      <div className="space-x-8 mx-auto items-center text-lg">
        <Link href="/">
          <p className="text-white text-xl">{masjidDisplayName}</p>
        </Link>
      </div>
      <div className="mr-4">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
