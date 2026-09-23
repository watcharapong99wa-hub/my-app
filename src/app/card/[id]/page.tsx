"use client";

import { Detail } from "@/kepup/pages/Detail";
import { UIProvider } from "@/kepup/components/ui";
import { RequireAuth } from "@/kepup/components/RequireAuth";

export default function CardPage() {
  return (
    <UIProvider>
      <RequireAuth>
        <Detail />
      </RequireAuth>
    </UIProvider>
  );
}
