"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Landing } from "@/kepup/pages/Landing";
import { UIProvider } from "@/kepup/components/ui";
import { auth } from "@/kepup/lib/auth";

export default function HomePage() {
  const router = useRouter();
  // Logged-in users go straight to the shelf - no start button mashing.
  const authed = auth.isAuthenticated();

  useEffect(() => {
    if (authed) {
      router.replace("/app");
    }
  }, [authed, router]);

  if (authed) return null;

  return (
    <UIProvider>
      <Landing
        onStart={() => {
          router.push(auth.isAuthenticated() ? "/app" : "/login");
        }}
        onTry={() => router.push("/capture")}
      />
    </UIProvider>
  );
}
