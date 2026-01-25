import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router"; // Import useRouter
import { logout } from "@/utils/auth"; // Import the logout function

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout(); // Call the logout function
      router.push("/login"); // Redirect to the login page after logout
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message); // Show an error message if logout fails
      } else {
        alert("An unknown error occurred"); // Fallback for unknown error types
      }
    }
  };

  return (
    <div className="navbar bg-[#1E5866] mb-2 flex-wrap">
      <div className="flex h-16">
        <Link href="/">
          <Image
            src="/logo.jpg"
            alt="Logo"
            width={48}
            height={48}
            className="h-12 mt-2 ml-2 rounded-full border border-yellow-500"
          />
        </Link>
      </div>
      <div className="space-x-8 mx-auto items-center text-lg">
        <Link href="/">
          <p className="text-white text-xl">
            Ghaneemathul Cassimiya Jumma Mosque Dematagoda Place
          </p>
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
