export const GRADE_LABELS: Record<string, string> = {
  m1: 'ม.1',
  m2: 'ม.2',
  m3: 'ม.3',
  m4: 'ม.4',
  m5: 'ม.5',
  m6: 'ม.6',
  voc: 'ปวช.',
};

export const TH_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const TH_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export const TH_WEEKDAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export const LOCATION_LABELS: Record<string, string> = {
  online: 'ออนไลน์',
  onsite: 'ออนไซต์',
  hybrid: 'ไฮบริด (ออนไลน์ + ออนไซต์)',
  unknown: 'ไม่ระบุ',
};

/** Converts Gregorian year to Buddhist Era (พ.ศ.) */
export function toBE(year: number): number {
  return year + 543;
}

export interface DeadlineInput {
  deadlineAt: string | null;
  deadlineTime?: string | null;
}

/**
 * The exact instant a deadline passes. Date-only deadlines (deadlineTime null)
 * count until the END of that day in Bangkok - we never silently pick 00:00.
 */
export function deadlineEnd(o: DeadlineInput): Date | null {
  if (!o || !o.deadlineAt) return null;
  const d = new Date(o.deadlineAt);
  if (isNaN(d.getTime())) return null;
  if (o.deadlineTime) return d; // exact instant stored with +07:00
  return new Date(d.getTime() + (24 * 60 * 60 * 1000 - 1));
}

export function daysUntilDeadline(o: DeadlineInput): number {
  const end = deadlineEnd(o);
  if (!end) return 999;
  const diffMs = end.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function urgencyOfDeadline(o: DeadlineInput): 'now' | 'soon' | 'calm' | 'passed' {
  if (!o || !o.deadlineAt) return 'calm';
  const days = daysUntilDeadline(o);
  if (days < 0) return 'passed';
  if (days <= 3) return 'now';
  if (days <= 7) return 'soon';
  return 'calm';
}

export function countdownLabelDeadline(o: DeadlineInput): string {
  if (!o || !o.deadlineAt) return 'ไม่มีวันปิดรับ';
  const days = daysUntilDeadline(o);
  if (days < 0) return 'ปิดรับแล้ว';
  if (days === 0) return 'ปิดรับวันนี้!';
  if (days === 1) return 'เหลือ 1 วัน';
  return `เหลือ ${days} วัน`;
}

/** "30 กันยายน 2569" from the stored date part (Bangkok). Never invents a time. */
export function deadlineDateText(o: DeadlineInput): string {
  if (!o || !o.deadlineAt) return '';
  const m = o.deadlineAt.slice(0, 10).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  const day = parseInt(m[3], 10);
  const month = TH_MONTHS_FULL[parseInt(m[2], 10) - 1];
  if (!month) return '';
  return `${day} ${month} ${toBE(parseInt(m[1], 10))}`;
}

/** "23:59 น." or "ไม่ระบุเวลา" - never a silent default. */
export function deadlineTimeText(o: DeadlineInput): string {
  if (!o || !o.deadlineAt) return '';
  return o.deadlineTime ? `${o.deadlineTime} น.` : 'ไม่ระบุเวลา';
}

export function daysUntil(iso: string | null): number {
  if (!iso) return 999;
  const target = new Date(iso);
  const now = new Date();
  target.setHours(23, 59, 59, 999);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function urgencyOf(iso: string | null): 'now' | 'soon' | 'calm' | 'passed' {
  if (!iso) return 'calm';
  const days = daysUntil(iso);
  if (days < 0) return 'passed';
  if (days <= 3) return 'now';
  if (days <= 7) return 'soon';
  return 'calm';
}

export function countdownLabel(iso: string | null): string {
  if (!iso) return 'ไม่มีวันปิดรับ';
  const days = daysUntil(iso);
  if (days < 0) return 'ปิดรับแล้ว';
  if (days === 0) return 'ปิดรับวันนี้!';
  if (days === 1) return 'เหลือ 1 วัน';
  return `เหลือ ${days} วัน`;
}

export function thaiLong(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = TH_MONTHS_FULL[d.getMonth()];
  const year = toBE(d.getFullYear());
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  if (hours === '00' && minutes === '00') {
    return `${day} ${month} ${year}`;
  }
  return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
}

export function thaiRange(start: string | null, end: string | null): string {
  if (!start && !end) return 'ไม่ระบุ';
  if (start && !end) return thaiLong(start);
  if (!start && end) return `ถึง ${thaiLong(end)}`;

  const s = new Date(start!);
  const e = new Date(end!);

  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.getDate()} - ${e.getDate()} ${TH_MONTHS_SHORT[s.getMonth()]} ${toBE(s.getFullYear())}`;
  }
  return `${s.getDate()} ${TH_MONTHS_SHORT[s.getMonth()]} - ${e.getDate()} ${TH_MONTHS_SHORT[e.getMonth()]} ${toBE(e.getFullYear())}`;
}

export function feeLabel(
  isFree?: boolean,
  amount?: number | null,
  unit?: string
): string {
  if (isFree) return 'ฟรี (ไม่มีค่าใช้จ่าย)';
  if (amount !== null && amount !== undefined && amount > 0) {
    const unitText =
      unit === 'per_person'
        ? ' / คน'
        : unit === 'per_team'
        ? ' / ทีม'
        : '';
    return `${amount.toLocaleString()} บาท${unitText}`;
  }
  return 'ไม่ระบุค่าใช้จ่าย';
}

export function teamLabel(min?: number | null, max?: number | null): string {
  if (!min && !max) return 'ไม่ระบุ';
  if (min === 1 && (!max || max === 1)) return 'เดี่ยว';
  if (min && max && min === max) return `ทีม ${min} คน`;
  if (min && max) return `ทีม ${min} - ${max} คน`;
  if (min) return `ทีมอย่างน้อย ${min} คน`;
  if (max) return `ทีมไม่เกิน ${max} คน`;
  return 'ไม่ระบุ';
}

export function gradeLabel(grades?: string[]): string {
  if (!grades || grades.length === 0) return 'ไม่ระบุ';
  return grades.map((g) => GRADE_LABELS[g] || g).join(', ');
}
