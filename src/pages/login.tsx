import { useState } from "react";
import { loginWithEmailPassword } from "@/utils/auth";
import { useRouter } from "next/router";
import Image from "next/image";
import { masjidConfig } from "@/config/masjid";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmailPassword(email, password);
      router.push("/");
    } catch {
      setError("Invalid credentials or something went wrong.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen ">
      <div className="bg-white p-8 rounded-lg border-2 border-gray-300 shadow-lg w-[350px]">
        <div className="mb-6 text-center">
          <Image
            src={masjidConfig.logoPath}
            alt={`${masjidConfig.name} logo`}
            className="mx-auto mb-4 rounded-full"
            width={150}
            height={150}
          />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            {masjidConfig.name}
          </h2>
          {masjidConfig.tagline ? (
            <p className="text-sm text-gray-500 mb-2">{masjidConfig.tagline}</p>
          ) : null}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Username or Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 mb-4 border border-gray-300 rounded-md"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 mb-6 border border-gray-300 rounded-md"
          />
          <button
            type="submit"
            className="w-full p-3 text-white rounded-md transition-colors"
            style={{ backgroundColor: masjidConfig.primaryColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = masjidConfig.primaryDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = masjidConfig.primaryColor;
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
