export type Category =
  | 'competition'
  | 'camp'
  | 'scholarship'
  | 'workshop'
  | 'hackathon'
  | 'open_house';

export type Status = 'saved' | 'interested' | 'applying' | 'submitted';

/** How a field value was obtained: found in source, inferred/guessed, or missing. */
export type FieldState = 'found' | 'inferred' | 'missing';

export interface OpportunityConfidence {
  title?: number;
  deadlineAt?: number;
  category?: number;
  fee?: number;
}

export interface Opportunity {
  id: string;
  title: string;
  category: Category;
  /** ISO instant. Date-only deadlines are stored as midnight +07:00 with deadlineTime null. */
  deadlineAt: string | null; // ISO string
  /** "HH:mm" in Asia/Bangkok, or null when the source states no time. */
  deadlineTime: string | null;
  deadlineIsEstimated?: boolean;
  /** found = stated in source, inferred = guessed, missing = not stated. */
  deadlineState: FieldState;
  organizer?: string | null;
  /** undefined = unknown (never default to free/paid). */
  isFree?: boolean;
  feeAmount?: number | null;
  feeUnit?: 'per_person' | 'per_team' | 'unknown';
  teamMin?: number | null;
  teamMax?: number | null;
  summary: string;
  applyUrl?: string | null;
  /** found = link from source, inferred/missing otherwise. */
  applyUrlState: FieldState;
  /** True when deadline or link was inferred/missing - user must confirm. */
  needsReview: boolean;
  confidence: OpportunityConfidence;
  status: Status;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  gradeLevels?: string[];
  locationType: 'online' | 'onsite' | 'hybrid' | 'unknown';
  venue?: string | null;
  province?: string | null;
  requiredDocs: string[];
  /** Evidence: original pasted text (capped), source URL, whether a screenshot was used. */
  originalText?: string | null;
  originalUrl?: string | null;
  hasOriginalImage?: boolean;
  createdAt?: string;
  extractedWithAi?: boolean;
}

export type GradeId = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'voc';

export interface AuthSession {
  name: string;
  grade: string | null;
}
