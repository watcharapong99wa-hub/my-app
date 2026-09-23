import type { Category } from "../types";

// Shared, server-safe parsers for extraction. Rule: NEVER invent data.
// If a date, link, fee, or document is not stated in the text, it stays empty.

const TH_MONTHS: Record<string, number> = {
  มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4, พฤษภาคม: 5, มิถุนายน: 6,
  กรกฎาคม: 7, สิงหาคม: 8, กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12,
  "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4, "พ.ค.": 5, "มิ.ย.": 6,
  "ก.ค.": 7, "ส.ค.": 8, "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
  มค: 1, กพ: 2, มีค: 3, เมย: 4, พค: 5, มิย: 6,
  กค: 7, สค: 8, กย: 9, ตค: 10, พย: 11, ธค: 12,
};

const EN_MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7,
  aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

export interface ParsedDateTime {
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm or null when no time stated */
  time: string | null;
  matchedText: string;
}

function toYear(raw: string): number | null {
  const y = parseInt(raw, 10);
  if (raw.length === 4) {
    if (y >= 2400 && y <= 2600) return y - 543; // Buddhist Era
    if (y >= 1900 && y <= 2100) return y;
    return null;
  }
  if (raw.length === 2) {
    // Thai posts write "69" for 2569; assume BE for >= 50, CE otherwise
    return y >= 50 ? 2500 + y : 2000 + y;
  }
  return null;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Find a real deadline date stated in the text. Supports Thai months
 * (เต็ม/ย่อ, พ.ศ./ค.ศ.), English months, and DD/MM/YYYY forms.
 * Returns null when nothing is stated - callers must NOT default.
 */
export function parseDateTime(text: string): ParsedDateTime | null {
  if (!text) return null;

  const thNames = Object.keys(TH_MONTHS)
    .sort((a, b) => b.length - a.length)
    .join("|");
  // 30 กันยายน 2569 / 30 ก.ย. 69 / 30 กย 2026 (+ optional time)
  const thRe = new RegExp(
    `(\\d{1,2})\\s*(${thNames})\\s*(\\d{2,4})?` +
      `(?:\\s*(?:เวลา\\s*)?(\\d{1,2})[:.](\\d{2})\\s*(?:น\\.?)?)?`
  );
  const th = text.match(thRe);
  if (th) {
    const day = parseInt(th[1], 10);
    const month = TH_MONTHS[th[2]];
    const year = th[3] ? toYear(th[3]) : null;
    if (day >= 1 && day <= 31 && month && year) {
      return {
        date: `${year}-${pad(month)}-${pad(day)}`,
        time: th[4] !== undefined ? `${pad(parseInt(th[4], 10))}:${pad(parseInt(th[5], 10))}` : null,
        matchedText: th[0].trim(),
      };
    }
  }

  // September 30, 2026 / 30 September 2026 / 30 Sep 2026 (+ optional time)
  const enRe = new RegExp(
    `(?:(\\d{1,2})\\s+)?([A-Za-z]+)\\s+(\\d{1,2})?,?\\s*(\\d{4})` +
      `(?:\\s*(?:at\\s*)?(\\d{1,2})[:.](\\d{2}))?`,
    "i"
  );
  const en = text.match(enRe);
  if (en) {
    const month = EN_MONTHS[en[2].toLowerCase()];
    const day = parseInt(en[1] || en[3], 10);
    const year = toYear(en[4]);
    if (day >= 1 && day <= 31 && month && year) {
      return {
        date: `${year}-${pad(month)}-${pad(day)}`,
        time: en[5] !== undefined ? `${pad(parseInt(en[5], 10))}:${pad(parseInt(en[6], 10))}` : null,
        matchedText: en[0].trim(),
      };
    }
  }

  // 30/09/2569, 30-09-2026, 30.09.69
  const num = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (num) {
    const day = parseInt(num[1], 10);
    const month = parseInt(num[2], 10);
    const year = toYear(num[3]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year) {
      return {
        date: `${year}-${pad(month)}-${pad(day)}`,
        time: null,
        matchedText: num[0],
      };
    }
  }

  return null;
}

/** First URL stated in the text, or null. Never invent one. */
export function findFirstUrl(text: string): string | null {
  if (!text) return null;
  const m = text.match(/https?:\/\/[^\s)>\]]+/);
  return m ? m[0].replace(/[.,;!?]+$/, "") : null;
}

/** Low-risk category guess (always treated as inferred, never stated). */
export function detectCategory(text: string): Category {
  const lower = (text || "").toLowerCase();
  if (lower.includes("ค่าย") || lower.includes("camp")) return "camp";
  if (lower.includes("ทุน") || lower.includes("scholarship")) return "scholarship";
  if (lower.includes("workshop") || lower.includes("เวิร์กช็อป") || lower.includes("อบรม"))
    return "workshop";
  if (lower.includes("hackathon") || lower.includes("แฮกกาธอน")) return "hackathon";
  if (lower.includes("open house") || lower.includes("เปิดบ้าน")) return "open_house";
  return "competition";
}

export interface DetectedFee {
  isFree?: boolean;
  amount: number | null;
}

/** Fee only when explicitly stated. */
export function detectFee(text: string): DetectedFee {
  const lower = (text || "").toLowerCase();
  if (lower.includes("ฟรี") || lower.includes("free") || lower.includes("ไม่มีค่าใช้จ่าย")) {
    return { isFree: true, amount: null };
  }
  const m = lower.match(/([\d,]+)\s*บาท/);
  if (m) {
    const amount = parseInt(m[1].replace(/,/g, ""), 10);
    if (!isNaN(amount) && amount > 0) return { isFree: false, amount };
  }
  return { isFree: undefined, amount: null };
}

const DOC_KEYWORDS = [
  "ปพ.1", "ปพ1", "transcript", "ระเบียนแสดงผล",
  "สำเนาบัตร", "บัตรประชาชน", "บัตรนักเรียน",
  "หนังสือยินยอม", "ผู้ปกครอง",
  "portfolio", "พอร์ต", "เรียงความ", "essay", "sop",
  "รูปถ่าย", "หนังสือรับรอง",
];

/** Required docs only when the text actually names them. */
export function detectDocs(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  const push = (label: string) => {
    if (!found.includes(label)) found.push(label);
  };
  if (/ปพ\.?1|transcript|ระเบียนแสดงผล/i.test(text)) push("ใบ ปพ.1 (ระเบียนแสดงผลการเรียน)");
  if (/สำเนาบัตร|บัตรประชาชน|บัตรนักเรียน/i.test(text)) push("สำเนาบัตรประจำตัวนักเรียน");
  if (/หนังสือยินยอม|ผู้ปกครอง/i.test(text)) push("หนังสือยินยอมจากผู้ปกครอง");
  if (/portfolio|พอร์ต/i.test(text)) push("Portfolio ผลงาน");
  if (/เรียงความ|essay|sop/i.test(text)) push("เรียงความ / Statement");
  if (/รูปถ่าย/i.test(text)) push("รูปถ่ายนักเรียน");
  if (/หนังสือรับรอง/i.test(text)) push("หนังสือรับรองจากโรงเรียน");
  void DOC_KEYWORDS;
  return found;
}

export interface DetectedTeam {
  min: number | null;
  max: number | null;
}

/** Team size only when explicitly stated, else unknown. */
export function detectTeam(text: string): DetectedTeam {
  if (!text) return { min: null, max: null };
  const lower = text.toLowerCase();
  if (/เดี่ยว|คนเดียว|individual/i.test(lower)) return { min: 1, max: 1 };
  const m = lower.match(/ทีม\s*(\d+)\s*[-–—]\s*(\d+)\s*คน|team\s*(\d+)\s*[-–—]\s*(\d+)/i);
  if (m) {
    const a = parseInt(m[1] || m[3], 10);
    const b = parseInt(m[2] || m[4], 10);
    if (!isNaN(a) && !isNaN(b)) return { min: Math.min(a, b), max: Math.max(a, b) };
  }
  const single = lower.match(/ทีม\s*(\d+)\s*คน/);
  if (single) {
    const n = parseInt(single[1], 10);
    if (!isNaN(n)) return { min: n, max: n };
  }
  return { min: null, max: null };
}

export type LocationKind = "online" | "onsite" | "hybrid" | "unknown";

/** Location only when explicitly stated, else unknown. */
export function detectLocation(text: string): LocationKind {
  if (!text) return "unknown";
  const lower = text.toLowerCase();
  const online = /online|ออนไลน์|zoom|ซูม|google\s*meet|teams/i.test(lower);
  const onsite =
    /on[\s-]?site|ออนไซต์|อาคาร|มหาวิทยาลัย|โรงเรียน|คณะ|จังหวัด|กรุงเทพ|ห้องประชุม/i.test(lower);
  if (online && onsite) return "hybrid";
  if (online) return "online";
  if (onsite) return "onsite";
  return "unknown";
}

/** Grade levels only when explicitly stated (ม.1-ม.6, ปวช.), else empty. */
export function detectGrades(text: string): string[] {
  if (!text) return [];
  const grades: string[] = [];
  const lower = text.toLowerCase();
  const push = (g: string) => {
    if (!grades.includes(g)) grades.push(g);
  };
  const range = lower.match(/ม\.\s*(\d)\s*[-–—~]\s*ม\.\s*(\d)/);
  if (range) {
    const a = Math.min(parseInt(range[1], 10), parseInt(range[2], 10));
    const b = Math.max(parseInt(range[1], 10), parseInt(range[2], 10));
    for (let g = a; g <= b; g++) if (g >= 1 && g <= 6) push(`m${g}`);
    return grades;
  }
  for (let g = 1; g <= 6; g++) {
    if (new RegExp(`ม\\.\\s*${g}(?!\\d)`).test(lower)) push(`m${g}`);
  }
  if (/ปวช|voc/i.test(lower)) push("voc");
  return grades;
}

/** Title = first substantial line, cleaned. Never a placeholder claim. */
export function detectTitle(text: string): string {
  const line =
    (text || "").split("\n").filter((l) => l.trim().length > 3)[0] || "";
  return line.replace(/^[#*\-•\s]+/, "").slice(0, 80);
}
