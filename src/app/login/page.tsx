"use client";

import { Suspense } from "react";
import { Login } from "@/kepup/pages/Login";
import { UIProvider } from "@/kepup/components/ui";

export default function LoginPage() {
  return (
    <UIProvider>
      <Suspense>
        <Login />
      </Suspense>
    </UIProvider>
  );
}
