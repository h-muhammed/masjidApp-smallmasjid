// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FirebaseProvider } from "@/contexts/firebaseContext"; // Import the FirebaseProvider
import Navbar from "@/components/Navbar"; // Import the Navbar component
import { useRouter } from "next/router";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const showNavbar = router.pathname === "/";

  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseProvider>
        {" "}
        {showNavbar && <Navbar />}
        <Component {...pageProps} />
      </FirebaseProvider>
    </QueryClientProvider>
  );
}
