// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FirebaseProvider, useFirebase } from "@/contexts/firebaseContext"; // Import the FirebaseProvider
import Navbar from "@/components/Navbar"; // Import the Navbar component
import { useRouter } from "next/router";

const queryClient = new QueryClient();

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // Keep firebase state available to pages, but don't show the full-page LoadingScreen globally.
  // Dashboard (`pages/index.tsx`) handles the full-page loading UI on its own.
  useFirebase();

  const showNavbar = router.pathname === "/";

  return (
    <>
      {showNavbar && <Navbar />}
      <Component {...pageProps} />
    </>
  );
}

export default function App(props: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseProvider>
        <AppContent {...props} />
      </FirebaseProvider>
    </QueryClientProvider>
  );
}
