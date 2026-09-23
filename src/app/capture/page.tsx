"use client";

import { Capture } from "@/kepup/pages/Capture";
import { UIProvider } from "@/kepup/components/ui";
import { RequireAuth } from "@/kepup/components/RequireAuth";

export default function CapturePage() {
  return (
    <UIProvider>
      <RequireAuth>
        <Capture />
      </RequireAuth>
    </UIProvider>
  );
}
