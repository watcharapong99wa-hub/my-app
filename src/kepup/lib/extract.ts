import type { Opportunity, Category } from '../types';

export function blankDraft(): Opportunity {
  return {
    id: `opp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: '',
    category: 'competition',
    deadlineAt: null,
    deadlineIsEstimated: false,
    organizer: null,
    isFree: true,
    feeAmount: null,
    feeUnit: 'unknown',
    teamMin: 1,
    teamMax: null,
    summary: '',
    applyUrl: null,
    confidence: {
      title: 1,
      deadlineAt: 1,
      category: 1,
      fee: 1,
    },
    status: 'saved',
    locationType: 'onsite',
    requiredDocs: [],
    gradeLevels: ['m4', 'm5', 'm6'],
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

/** Local rule-based parser for offline / instant detection */
function parseOffline(text: string): { draft: Opportunity; found: string[] } {
  const found: string[] = [];
  const draft = blankDraft();

  // 1. Try to find title (first non-empty line or keyword)
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    draft.title = lines[0].slice(0, 100);
    draft.confidence.title = 0.85;
    found.push('ชื่อกิจกรรม');
  }

  // 2. Try to find category
  const lower = text.toLowerCase();
  if (lower.includes('hackathon') || lower.includes('แฮกกาธอน')) {
    draft.category = 'hackathon';
    draft.confidence.category = 0.95;
    found.push('หมวดหมู่: แฮกกาธอน');
  } else if (lower.includes('ทุน') || lower.includes('scholarship')) {
    draft.category = 'scholarship';
    draft.confidence.category = 0.95;
    found.push('หมวดหมู่: ทุน');
  } else if (lower.includes('ค่าย') || lower.includes('camp')) {
    draft.category = 'camp';
    draft.confidence.category = 0.9;
    found.push('หมวดหมู่: ค่าย');
  } else if (lower.includes('open house') || lower.includes('เปิดบ้าน')) {
    draft.category = 'open_house';
    draft.confidence.category = 0.9;
    found.push('หมวดหมู่: Open House');
  } else if (lower.includes('workshop') || lower.includes('เวิร์กช็อป') || lower.includes('อบรม')) {
    draft.category = 'workshop';
    draft.confidence.category = 0.85;
    found.push('หมวดหมู่: เวิร์กช็อป');
  } else {
    draft.category = 'competition';
  }

  // 3. Try to detect deadline
  // e.g. "ปิดรับ 15 พ.ย. 2569" or "deadline 2026-11-15" or "ภายในวันที่ 20"
  const dateMatch = text.match(/(\d{1,2})\s*(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)\s*(\d{2,4})?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const monthStr = dateMatch[2].replace(/\./g, '');
    const monthMap: Record<string, number> = {
      'มค': 0, 'กพ': 1, 'มีค': 2, 'เมย': 3, 'พค': 4, 'มิย': 5,
      'กค': 6, 'สค': 7, 'กย': 8, 'ตค': 9, 'พย': 10, 'ธค': 11,
    };
    const m = monthMap[monthStr] ?? 10;
    let yr = new Date().getFullYear();
    if (dateMatch[3]) {
      const parsedYr = parseInt(dateMatch[3], 10);
      yr = parsedYr > 2500 ? parsedYr - 543 : parsedYr;
    }
    const d = new Date(yr, m, day, 23, 59, 0);
    draft.deadlineAt = d.toISOString();
    draft.confidence.deadlineAt = 0.85;
    found.push(`วันปิดรับ: ${day}/${m + 1}/${yr}`);
  } else {
    // Default estimated 14 days ahead
    const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    draft.deadlineAt = d.toISOString();
    draft.deadlineIsEstimated = true;
    draft.confidence.deadlineAt = 0.6; // flagged for review
  }

  // 4. Try to detect fee
  if (text.includes('ฟรี') || lower.includes('free') || text.includes('ไม่มีค่าใช้จ่าย')) {
    draft.isFree = true;
    draft.confidence.fee = 1;
    found.push('ค่าสมัคร: ฟรี');
  } else {
    const feeMatch = text.match(/(\d{2,5})\s*บาท/);
    if (feeMatch) {
      draft.isFree = false;
      draft.feeAmount = parseInt(feeMatch[1], 10);
      draft.confidence.fee = 0.9;
      found.push(`ค่าสมัคร: ${feeMatch[1]} บาท`);
    }
  }

  // 5. Try to find apply URL
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    draft.applyUrl = urlMatch[0];
    found.push('ลิงก์รับสมัคร');
  }

  // Summary
  draft.summary = lines.slice(1, 4).join(' ').slice(0, 200) || draft.title;

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
        const draft: Opportunity = {
          id: raw.id || `opp-${Date.now()}`,
          title: raw.titleTh || raw.title || text?.slice(0, 60) || 'กิจกรรมใหม่',
          category: (raw.category as Category) || 'competition',
          deadlineAt: raw.deadlineDate
            ? new Date(raw.deadlineDate).toISOString()
            : raw.deadlineAt || null,
          deadlineIsEstimated: false,
          organizer: raw.organizerTh || raw.organizer || null,
          isFree: raw.fee ? raw.fee.includes('ฟรี') : true,
          feeAmount: null,
          feeUnit: 'unknown',
          teamMin: 1,
          teamMax: null,
          summary: raw.summaryTh || raw.rawText?.slice(0, 180) || '',
          applyUrl: raw.applicationUrl || raw.applyUrl || null,
          confidence: {
            title: 1,
            deadlineAt: raw.deadlineDate ? 0.95 : 0.7,
            category: 1,
            fee: 0.9,
          },
          status: 'saved',
          locationType: 'onsite',
          requiredDocs: raw.requiredDocs || [],
          gradeLevels: ['m4', 'm5', 'm6'],
        };

        return {
          draft,
          latencyMs: Date.now() - startTime,
          deadlineDisputed: false,
          usedFallback: false,
          found: ['ดึงข้อมูลผ่านระบบ AI สำเร็จ'],
        };
      }
    }
  } catch {
    // Network or server unavailable - fallback gracefully
  }

  // Fallback to client-side heuristic parser
  const parsed = parseOffline(text || '');
  return {
    draft: parsed.draft,
    latencyMs: Date.now() - startTime,
    deadlineDisputed: false,
    usedFallback: true,
    found: parsed.found,
  };
}
