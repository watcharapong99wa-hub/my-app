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
};

/** Converts Gregorian year to Buddhist Era (พ.ศ.) */
export function toBE(year: number): number {
  return year + 543;
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
  return 'ฟรี หรือไม่ระบุค่าใช้จ่าย';
}

export function teamLabel(min?: number | null, max?: number | null): string {
  if (!min && !max) return 'เดี่ยว หรือทีม';
  if (min === 1 && (!max || max === 1)) return 'เดี่ยว';
  if (min && max && min === max) return `ทีม ${min} คน`;
  if (min && max) return `ทีม ${min} - ${max} คน`;
  if (min) return `ทีมอย่างน้อย ${min} คน`;
  if (max) return `ทีมไม่เกิน ${max} คน`;
  return 'ไม่ระบุ';
}

export function gradeLabel(grades?: string[]): string {
  if (!grades || grades.length === 0) return 'ทุกระดับชั้น';
  return grades.map((g) => GRADE_LABELS[g] || g).join(', ');
}
