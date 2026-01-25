import { useState } from "react";
import { loginWithEmailPassword } from "@/utils/auth";
import { useRouter } from "next/router";
import Image from "next/image"; // Import for image handling

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
          {/* Add the company logo */}
          <Image
            src="/Slogo.png"
            alt="Logo"
            className="mx-auto mb-4"
            width={150} // Set the logo width
            height={200} // Maintain the aspect ratio
          />
          {/* <h2 className="text-2xl font-semibold mb-2">Login</h2> */}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {/* Login Form */}
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
            className="w-full p-3 bg-[#0078d7] text-white rounded-md hover:bg-[#005bb5]"
          >
            Login
          </button>
        </form>

        {/* <p className="text-center text-xs text-gray-500 mt-6">© YourCompany.com</p> */}
      </div>
    </div>
  );
};

export default LoginForm;
