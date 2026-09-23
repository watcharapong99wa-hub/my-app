import type { Opportunity } from "../types";

export interface ReviewMeta {
  latencyMs: number;
  deadlineDisputed: boolean;
  usedFallback?: boolean;
  found?: string[];
}

export interface ReviewState {
  draft?: Opportunity;
  manual?: boolean;
  meta?: ReviewMeta;
  /** Editing a card that is already on the shelf, not adding a new one. */
  editing?: boolean;
}

const KEY = "kepup_review_state";

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function setReviewState(state: ReviewState): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable - Review page will show the empty state
  }
}

/** Reads the pending review state once and clears it, like router location.state. */
export function takeReviewState(): ReviewState | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    s.removeItem(KEY);
    return raw ? (JSON.parse(raw) as ReviewState) : null;
  } catch {
    return null;
  }
}
