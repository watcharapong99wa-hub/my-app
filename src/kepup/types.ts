export type Category =
  | 'competition'
  | 'camp'
  | 'scholarship'
  | 'workshop'
  | 'hackathon'
  | 'open_house';

export type Status = 'saved' | 'interested' | 'applying' | 'submitted';

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
  deadlineAt: string | null; // ISO string
  deadlineIsEstimated?: boolean;
  organizer?: string | null;
  isFree?: boolean;
  feeAmount?: number | null;
  feeUnit?: 'per_person' | 'per_team' | 'unknown';
  teamMin?: number | null;
  teamMax?: number | null;
  summary: string;
  applyUrl?: string | null;
  confidence: OpportunityConfidence;
  status: Status;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  gradeLevels?: string[];
  locationType: 'online' | 'onsite' | 'hybrid';
  venue?: string | null;
  province?: string | null;
  requiredDocs: string[];
  createdAt?: string;
  extractedWithAi?: boolean;
}

export type GradeId = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'voc';

export interface AuthSession {
  name: string;
  grade: string | null;
}
