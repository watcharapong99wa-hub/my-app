"use client";

import { Suspense } from "react";
import { Review } from "@/kepup/pages/Review";
import { UIProvider } from "@/kepup/components/ui";
import { RequireAuth } from "@/kepup/components/RequireAuth";

export default function ReviewPage() {
  return (
    <UIProvider>
      <Suspense>
        <RequireAuth>
          <Review />
        </RequireAuth>
      </Suspense>
    </UIProvider>
  );
}
