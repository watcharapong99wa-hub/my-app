"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/kepup/lib/auth";

/** Redirects to /login when no local KepUp session exists (replaces RequireAuth). */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const allowed = auth.isAuthenticated();

  useEffect(() => {
    if (!allowed) {
      router.replace("/login");
    }
  }, [allowed, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
