"use client";

import { Suspense } from "react";
import { Dashboard } from "@/kepup/pages/Dashboard";
import { UIProvider } from "@/kepup/components/ui";
import { RequireAuth } from "@/kepup/components/RequireAuth";

export default function AppPage() {
  return (
    <UIProvider>
      <Suspense>
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      </Suspense>
    </UIProvider>
  );
}
