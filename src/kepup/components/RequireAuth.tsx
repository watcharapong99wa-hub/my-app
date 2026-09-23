"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/kepup/lib/auth";

/** Redirects to /login (preserving ?next=) when no local KepUp session exists. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allowed = auth.isAuthenticated();

  useEffect(() => {
    if (!allowed) {
      const query = searchParams.toString();
      const here = query ? `${pathname}?${query}` : pathname;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
    }
  }, [allowed, pathname, searchParams, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
