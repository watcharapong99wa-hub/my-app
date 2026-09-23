"use client";

import { Suspense } from "react";
import { Capture } from "@/kepup/pages/Capture";
import { UIProvider } from "@/kepup/components/ui";

export default function CapturePage() {
  return (
    <UIProvider>
      <Suspense>
        <Capture />
      </Suspense>
    </UIProvider>
  );
}
