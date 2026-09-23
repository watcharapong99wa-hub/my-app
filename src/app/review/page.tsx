"use client";

import { Review } from "@/kepup/pages/Review";
import { UIProvider } from "@/kepup/components/ui";
import { RequireAuth } from "@/kepup/components/RequireAuth";

export default function ReviewPage() {
  return (
    <UIProvider>
      <RequireAuth>
        <Review />
      </RequireAuth>
    </UIProvider>
  );
}
