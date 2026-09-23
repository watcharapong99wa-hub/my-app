"use client";

import { useRouter } from "next/navigation";
import { Landing } from "@/kepup/pages/Landing";
import { UIProvider } from "@/kepup/components/ui";
import { useAppSession } from "@/kepup/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const { session, loading } = useAppSession();
  return (
    <UIProvider>
      <Landing
        onStart={() => {
          if (loading) return;
          router.push(session ? "/app" : "/login");
        }}
      />
    </UIProvider>
  );
}
