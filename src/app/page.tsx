"use client";

import { useRouter } from "next/navigation";
import { Landing } from "@/kepup/pages/Landing";
import { UIProvider } from "@/kepup/components/ui";
import { auth } from "@/kepup/lib/auth";

export default function HomePage() {
  const router = useRouter();
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
