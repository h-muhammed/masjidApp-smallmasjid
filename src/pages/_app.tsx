// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FirebaseProvider, useFirebase } from "@/contexts/firebaseContext"; // Import the FirebaseProvider
import Navbar from "@/components/Navbar"; // Import the Navbar component
import LoadingScreen from "@/components/LoadingScreen"; // Import the LoadingScreen component
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { loading } = useFirebase();
  const [isNavigating, setIsNavigating] = useState(false);

  const showNavbar = router.pathname === "/";

  // Handle route change events to show loading screen during navigation
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsNavigating(true);
    };

    const handleRouteChangeComplete = () => {
      setIsNavigating(false);
    };

    const handleRouteChangeError = () => {
      setIsNavigating(false);
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    router.events.on("routeChangeError", handleRouteChangeError);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
      router.events.off("routeChangeError", handleRouteChangeError);
    };
  }, [router.events]);

  // Show loading screen during initial Firebase auth check or during navigation
  if (loading || isNavigating) {
    return <LoadingScreen />;
  }

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
