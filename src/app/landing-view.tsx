"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Landing } from "@/kepup/pages/Landing";
import { UIProvider } from "@/kepup/components/ui";
import { auth, ensureSessionCookie } from "@/kepup/lib/auth";

export function HomeLanding() {
  const router = useRouter();
  // Backup for cookie-less sessions: redirect client-side (server handles the rest).
  const authed = auth.isAuthenticated();

  useEffect(() => {
    if (authed) {
      ensureSessionCookie();
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
