import type { Opportunity } from '../types';
import { deadlineEnd } from './format';

/**
 * Calendar events always use the exact deadline instant (date + stated time).
 * Date-only deadlines count until end of day Bangkok - never silent 07:00.
 * Google Calendar links cannot carry a reminder; the .ics file includes one.
 */
export function googleCalendarUrl(o: Opportunity): string | null {
  const deadline = deadlineEnd(o);
  if (!deadline) return null;

  // 1-hour event ending at the deadline
  const start = new Date(deadline.getTime() - 60 * 60 * 1000);
  const end = deadline;

  const fmt = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d+/g, '');

  const text = encodeURIComponent(`[KepUp เดดไลน์] ${o.title}`);
  const details = encodeURIComponent(
    `${o.summary || ''}\n\nผู้จัด: ${o.organizer || '-'}\nลิงก์สมัคร: ${o.applyUrl || '-'}\nบันทึกจาก KepUp`
  );
  const location = encodeURIComponent(
    o.locationType === 'online' ? 'ออนไลน์' : [o.venue, o.province].filter(Boolean).join(', ') || ''
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${location}`;
}

export function downloadIcs(o: Opportunity): void {
  const deadline = deadlineEnd(o);
  if (!deadline) return;

  const start = new Date(deadline.getTime() - 60 * 60 * 1000);
  const end = deadline;

  const fmt = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d+/g, '');

  const cleanText = (str: string) => str.replace(/\n/g, '\\n').replace(/,/g, '\\,');
  const safeLocation = o.locationType === 'online' || o.locationType === 'unknown'
    ? o.locationType === 'online' ? 'Online' : ''
    : [o.venue, o.province].filter(Boolean).join(', ') || '';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KepUp//TH//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:kepup-${o.id}-${Date.now()}@kepup.app`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${cleanText(`[ปิดรับสมัคร] ${o.title}`)}`,
    `DESCRIPTION:${cleanText(`${o.summary || ''} | ผู้จัด: ${o.organizer || '-'} | ลิงก์: ${o.applyUrl || '-'}`)}`,
    `LOCATION:${cleanText(safeLocation)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:เตือนปิดรับสมัครล่วงหน้า 1 วัน',
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kepup-${o.id}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
