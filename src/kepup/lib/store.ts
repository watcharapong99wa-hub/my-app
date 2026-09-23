import { useState, useEffect } from 'react';
import type { Opportunity } from '../types';

const STORAGE_KEY = 'kepup_shelf_items_v2';

// Realistic sample opportunities
const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'การแข่งขันหุ่นยนต์และ AI นวัตกรรมระดับมัธยมศึกษา (AI Youth Hackathon)',
    category: 'hackathon',
    deadlineAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    deadlineIsEstimated: false,
    organizer: 'คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย',
    isFree: true,
    feeAmount: null,
    feeUnit: 'unknown',
    teamMin: 2,
    teamMax: 4,
    summary: 'ประลองไอเดียสร้าง AI และหุ่นยนต์เพื่อแก้ปัญหาเมืองอัจฉริยะ ชิงเงินรางวัลรวมกว่า 150,000 บาท พร้อมสิทธิ์พิจารณาเข้าศึกษาต่อ TCAS รอบ 1',
    applyUrl: 'https://example.com/ai-youth-hackathon',
    confidence: { title: 1, deadlineAt: 0.95, category: 1, fee: 1 },
    status: 'applying',
    eventStartAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    eventEndAt: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
    gradeLevels: ['m4', 'm5', 'm6'],
    locationType: 'hybrid',
    venue: 'อาคารวิศวฯ 100 ปี จุฬาฯ',
    province: 'กรุงเทพมหานคร',
    requiredDocs: ['ใบ ปพ.1 (5 ภาคเรียน)', 'โครงร่างไอเดีย (Proposal)', 'หนังสือรับรองสถานภาพนักเรียน'],
  },
  {
    id: 'opp-2',
    title: 'ทุนการศึกษาแลกเปลี่ยนเยาวชนนานาชาติ AFS International',
    category: 'scholarship',
    deadlineAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    deadlineIsEstimated: false,
    organizer: 'มูลนิธิการศึกษาและวัฒนธรรมสัมพันธ์ไทย-นานาชาติ (เอเอฟเอส ประเทศไทย)',
    isFree: false,
    feeAmount: 250,
    feeUnit: 'per_person',
    teamMin: 1,
    teamMax: 1,
    summary: 'สอบชิงทุนแลกเปลี่ยนเรียนต่อระดับมัธยมปลายในต่างประเทศ 1 ปีการศึกษา (สหรัฐฯ ยุโรป ญี่ปุ่น) เสริมพอร์ตและทักษะภาษาแบบก้าวกระโดด',
    applyUrl: 'https://example.com/afs-scholarship',
    confidence: { title: 1, deadlineAt: 1, category: 1, fee: 0.9 },
    status: 'saved',
    eventStartAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    eventEndAt: null,
    gradeLevels: ['m3', 'm4', 'm5'],
    locationType: 'online',
    venue: 'สอบข้อเขียนออนไลน์',
    province: 'ทั่วประเทศ',
    requiredDocs: ['ใบ ปพ.1 เกรดเฉลี่ย 3.00 ขึ้นไป', 'รูปถ่ายนักเรียน 1 นิ้ว', 'สำเนาบัตรประชาชน'],
  },
  {
    id: 'opp-3',
    title: 'ค่ายอยากเป็นหมอรามาฯ ครั้งที่ 26 (Rama Medical Camp)',
    category: 'camp',
    deadlineAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    deadlineIsEstimated: false,
    organizer: 'สโมสรนักศึกษาแพทย์รามาธิบดี ม.มหิดล',
    isFree: true,
    feeAmount: null,
    feeUnit: 'unknown',
    teamMin: 1,
    teamMax: 1,
    summary: 'สัมผัสชีวิตนักศึกษาแพทย์ ส่องห้องปฏิบัติการกายวิภาคศาสตร์ (Gross Anatomy) ฝึกทำหัตถการจำลอง และแนะแนวเตรียมสอบแพทย์ กสพท / TCAS1',
    applyUrl: 'https://example.com/rama-med-camp',
    confidence: { title: 1, deadlineAt: 1, category: 1, fee: 1 },
    status: 'interested',
    eventStartAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    eventEndAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    gradeLevels: ['m4', 'm5', 'm6'],
    locationType: 'onsite',
    venue: 'คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี',
    province: 'กรุงเทพมหานคร',
    requiredDocs: ['เรียงความบอกเล่าแรงบันดาลใจ', 'ใบ ปพ.1'],
  },
  {
    id: 'opp-4',
    title: 'การแข่งขันตอบปัญหาวิชาการเคมีโอลิมปิกระดับชาติ (Chem Challenge 2026)',
    category: 'competition',
    deadlineAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    deadlineIsEstimated: false,
    organizer: 'ภาควิชาเคมี คณะวิทยาศาสตร์ มหาวิทยาลัยเกษตรศาสตร์',
    isFree: false,
    feeAmount: 300,
    feeUnit: 'per_team',
    teamMin: 2,
    teamMax: 3,
    summary: 'แข่งขันสอบวัดความรู้ทฤษฎีและทดลองเคมี ม.ปลาย ชิงโล่พระราชทานและเกียรติบัตรระดับประเทศ ใส่พอร์ต TCAS คณะวิทยาศาสตร์ และแพทย์',
    applyUrl: 'https://example.com/chem-challenge',
    confidence: { title: 1, deadlineAt: 1, category: 1, fee: 1 },
    status: 'saved',
    eventStartAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    eventEndAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    gradeLevels: ['m4', 'm5', 'm6'],
    locationType: 'onsite',
    venue: 'ห้องประชุมใหญ่ มหาวิทยาลัยเกษตรศาสตร์ (บางเขน)',
    province: 'กรุงเทพมหานคร',
    requiredDocs: ['หนังสือรับรองจากทางโรงเรียน'],
  },
  {
    id: 'opp-5',
    title: 'เวิร์กช็อป UI/UX Design & Portfolio สำหรับสายเทคโนโลยี',
    category: 'workshop',
    deadlineAt: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    deadlineIsEstimated: false,
    organizer: 'สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง (KMITL)',
    isFree: true,
    feeAmount: null,
    feeUnit: 'unknown',
    teamMin: 1,
    teamMax: 1,
    summary: 'เรียนรู้กระบวนการ Design Thinking ออกแบบแอปพลิเคชันด้วย Figma และจัดทำ Case Study พอร์ตโฟลิโอสำหรับยื่นเข้าคณะไอทีและนิเทศศิลป์',
    applyUrl: 'https://example.com/kmitl-uiux',
    confidence: { title: 1, deadlineAt: 0.9, category: 1, fee: 1 },
    status: 'saved',
    eventStartAt: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    eventEndAt: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    gradeLevels: ['m3', 'm4', 'm5', 'm6', 'voc'],
    locationType: 'online',
    venue: 'Zoom Meeting',
    province: 'ออนไลน์',
    requiredDocs: [],
  },
  {
    id: 'opp-6',
    title: 'Chula Expo & Open House 2026 เปิดบ้านจุฬาลงกรณ์มหาวิทยาลัย',
    category: 'open_house',
    deadlineAt: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    deadlineIsEstimated: false,
    organizer: 'องค์การบริหารสโมสรนิสิตจุฬาฯ (อบจ.)',
    isFree: true,
    feeAmount: null,
    feeUnit: 'unknown',
    teamMin: 1,
    teamMax: null,
    summary: 'เจาะลึก 19 คณะ 2 สำนักวิชา ร่วมกิจกรรม Workshop แต่ละคณะ พูดคุยกับรุ่นพี่นิสิต พร้อมรับ e-Certificate เมื่อเข้าร่วมตามเงื่อนไข',
    applyUrl: 'https://example.com/chula-expo',
    confidence: { title: 1, deadlineAt: 1, category: 1, fee: 1 },
    status: 'saved',
    eventStartAt: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
    eventEndAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    gradeLevels: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'voc'],
    locationType: 'onsite',
    venue: 'จุฬาลงกรณ์มหาวิทยาลัย',
    province: 'กรุงเทพมหานคร',
    requiredDocs: [],
  }
];

class ShelfStore {
  private items: Opportunity[] = [];
  private listeners = new Set<() => void>();

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (typeof window === "undefined") {
        this.items = [];
        return;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.items = JSON.parse(raw);
        return;
      }
    } catch (e) {
      console.error('Failed to load shelf from storage', e);
    }
    this.items = INITIAL_OPPORTUNITIES;
    this.save();
  }

  private save() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      }
    } catch (e) {
      console.error('Failed to save shelf to storage', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  getAll(): Opportunity[] {
    return this.items;
  }

  get(id: string): Opportunity | undefined {
    return this.items.find((item) => item.id === id);
  }

  add(item: Opportunity) {
    this.items = [item, ...this.items.filter((i) => i.id !== item.id)];
    this.save();
  }

  update(id: string, partial: Partial<Opportunity>) {
    this.items = this.items.map((i) => (i.id === id ? { ...i, ...partial } : i));
    this.save();
  }

  remove(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    this.save();
  }

  findDuplicate(title: string, deadlineAt: string | null): Opportunity | undefined {
    const clean = title.trim().toLowerCase();
    return this.items.find((i) => {
      const matchTitle = i.title.trim().toLowerCase() === clean;
      const matchDeadline =
        (i.deadlineAt && deadlineAt && i.deadlineAt.slice(0, 10) === deadlineAt.slice(0, 10)) ||
        (!i.deadlineAt && !deadlineAt);
      return matchTitle && matchDeadline;
    });
  }

  reset() {
    this.items = INITIAL_OPPORTUNITIES;
    this.save();
  }
}

export const shelf = new ShelfStore();

export function useShelf(): Opportunity[] {
  const [items, setItems] = useState<Opportunity[]>(() => shelf.getAll());

  useEffect(() => {
    return shelf.subscribe(() => {
      setItems([...shelf.getAll()]);
    });
  }, []);

  return items;
}
