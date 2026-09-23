"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/kepup/lib/auth";

/** Redirects to /login when there is no Google or nickname session. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading } = useAppSession();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading || !session) return null;
  return <>{children}</>;
}
