import type { Opportunity, Category } from '../types';
import {
  parseDateTime,
  findFirstUrl,
  detectCategory,
  detectFee,
  detectDocs,
  detectTeam,
  detectLocation,
  detectGrades,
  detectTitle,
} from './sourceParse';

export function blankDraft(): Opportunity {
  return {
    id: `opp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: '',
    category: 'competition',
    deadlineAt: null,
    deadlineTime: null,
    deadlineIsEstimated: false,
    deadlineState: 'missing',
    organizer: null,
    isFree: undefined,
    feeAmount: null,
    feeUnit: 'unknown',
    teamMin: null,
    teamMax: null,
    summary: '',
    applyUrl: null,
    applyUrlState: 'missing',
    needsReview: false,
    confidence: {
      title: 1,
      deadlineAt: 1,
      category: 1,
      fee: 1,
    },
    status: 'saved',
    locationType: 'unknown',
    requiredDocs: [],
    gradeLevels: ['m4', 'm5', 'm6'],
    originalText: null,
    originalUrl: null,
    hasOriginalImage: false,
  };
}

export function fileToInlineImage(
  file: File
): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      if (commaIdx === -1) {
        reject(new Error('Invalid data URL'));
        return;
      }
      const data = result.slice(commaIdx + 1);
      resolve({
        mimeType: file.type || 'image/jpeg',
        data,
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export interface ExtractResult {
  draft: Opportunity;
  latencyMs: number;
  deadlineDisputed: boolean;
  usedFallback?: boolean;
  found?: string[];
}

/** Local rule-based parser. Honest: nothing stated = empty, never invented. */
function parseOffline(text: string): { draft: Opportunity; found: string[] } {
  const found: string[] = [];
  const draft = blankDraft();

  const title = detectTitle(text);
  if (title) {
    draft.title = title.slice(0, 100);
    draft.confidence.title = 0.85;
    found.push('ชื่อกิจกรรม');
  }

  draft.category = detectCategory(text);
  draft.confidence.category = 0.7;

  const dt = parseDateTime(text);
  if (dt) {
    draft.deadlineAt = dt.time
      ? `${dt.date}T${dt.time}:00+07:00`
      : `${dt.date}T00:00:00+07:00`;
    draft.deadlineTime = dt.time;
    draft.deadlineState = 'found';
    draft.confidence.deadlineAt = 0.9;
    found.push(`วันปิดรับ: ${dt.date}${dt.time ? ` ${dt.time} น.` : ''}`);
  } else {
    draft.deadlineAt = null;
    draft.deadlineTime = null;
    draft.deadlineState = 'missing';
    draft.confidence.deadlineAt = 0;
  }

  const fee = detectFee(text);
  draft.isFree = fee.isFree;
  draft.feeAmount = fee.amount;
  if (fee.isFree === true) {
    draft.confidence.fee = 1;
    found.push('ค่าสมัคร: ฟรี');
  } else if (fee.amount) {
    draft.confidence.fee = 0.9;
    found.push(`ค่าสมัคร: ${fee.amount} บาท`);
  } else {
    draft.confidence.fee = 0;
  }

  const url = findFirstUrl(text);
  if (url) {
    draft.applyUrl = url;
    draft.applyUrlState = 'found';
    found.push('ลิงก์รับสมัคร');
  } else {
    draft.applyUrl = null;
    draft.applyUrlState = 'missing';
  }

  draft.requiredDocs = detectDocs(text);
  if (draft.requiredDocs.length > 0) found.push(`เอกสาร ${draft.requiredDocs.length} อย่าง`);

  const team = detectTeam(text);
  draft.teamMin = team.min;
  draft.teamMax = team.max;

  draft.locationType = detectLocation(text);
  draft.gradeLevels = detectGrades(text);

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  draft.summary = lines.slice(1, 4).join(' ').slice(0, 200) || draft.title;

  draft.needsReview = draft.deadlineState !== 'found' || draft.applyUrlState !== 'found';

  return { draft, found };
}

export async function extract({
  text,
  images,
}: {
  text?: string;
  images?: { mimeType: string; data: string }[];
}): Promise<ExtractResult> {
  const startTime = Date.now();

  try {
    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        images: images && images.length > 0 ? images : undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.opportunity) {
        const raw = data.opportunity;
        const dt = typeof raw.deadlineDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.deadlineDate)
          ? raw.deadlineDate
          : null;
        const tm = typeof raw.deadlineTime === 'string' && /^\d{2}:\d{2}$/.test(raw.deadlineTime)
          ? raw.deadlineTime
          : null;
        const draft: Opportunity = {
          id: raw.id || `opp-${Date.now()}`,
          title: raw.titleTh || raw.title || text?.slice(0, 60) || 'กิจกรรมใหม่',
          category: (raw.category as Category) || 'competition',
          deadlineAt: dt ? (tm ? `${dt}T${tm}:00+07:00` : `${dt}T00:00:00+07:00`) : null,
          deadlineTime: tm,
          deadlineState: dt ? 'found' : 'missing',
          organizer: raw.organizerTh || raw.organizer || null,
          isFree: typeof raw.fee === 'string'
            ? raw.fee.includes('ฟรี') ? true : /บาท|\d/.test(raw.fee) ? false : undefined
            : undefined,
          feeAmount: null,
          feeUnit: 'unknown',
          teamMin: typeof raw.teamMin === "number" ? raw.teamMin : null,
          teamMax: typeof raw.teamMax === "number" ? raw.teamMax : null,
          summary: raw.summaryTh || raw.summary || text?.slice(0, 180) || '',
          applyUrl: raw.applicationUrl || raw.applyUrl || findFirstUrl(text || '') || null,
          applyUrlState: raw.applicationUrl || raw.applyUrl || findFirstUrl(text || '') ? 'found' : 'missing',
          needsReview: false,
          confidence: {
            title: 1,
            deadlineAt: dt ? 0.95 : 0,
            category: 0.8,
            fee: 0.5,
          },
          status: 'saved',
          locationType: ['online', 'onsite', 'hybrid'].includes(raw.locationType)
            ? raw.locationType
            : 'unknown',
          venue: raw.locationDetailTh || raw.venue || null,
          requiredDocs: Array.isArray(raw.requiredDocs) ? raw.requiredDocs : [],
          gradeLevels: Array.isArray(raw.gradeLevels) ? raw.gradeLevels : [],
          originalText: (text || '').slice(0, 2000) || null,
          originalUrl: findFirstUrl(text || '') || null,
          hasOriginalImage: Boolean(images && images.length > 0),
        };
        draft.needsReview = draft.deadlineState !== 'found' || draft.applyUrlState !== 'found';

        return {
          draft,
          latencyMs: Date.now() - startTime,
          deadlineDisputed: false,
          usedFallback: data?.source && data.source !== 'gemini',
          found: ['ดึงข้อมูลผ่านระบบ AI สำเร็จ'],
        };
      }
    }
  } catch {
    // Network or server unavailable - fallback gracefully
  }

  // Fallback to client-side heuristic parser (honest: no invented fields)
  const parsed = parseOffline(text || '');
  parsed.draft.originalText = (text || '').slice(0, 2000) || null;
  parsed.draft.originalUrl = findFirstUrl(text || '');
  parsed.draft.hasOriginalImage = Boolean(images && images.length > 0);
  return {
    draft: parsed.draft,
    latencyMs: Date.now() - startTime,
    deadlineDisputed: false,
    usedFallback: true,
    found: parsed.found,
  };
}
