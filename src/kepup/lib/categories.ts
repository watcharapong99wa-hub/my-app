import type { Category } from '../types';

export interface CategoryMeta {
  label: string;
  gradient: string;
  pillColor: string;
}

export const CATEGORIES: Record<Category, CategoryMeta> = {
  competition: {
    label: 'การแข่งขัน',
    gradient: 'linear-gradient(145deg, #FF6FA5, #EE4B8B)',
    pillColor: '#EE4B8B',
  },
  camp: {
    label: 'ค่าย / อบรม',
    gradient: 'linear-gradient(145deg, #FF9A4D, #F5843C)',
    pillColor: '#F5843C',
  },
  scholarship: {
    label: 'ทุนการศึกษา',
    gradient: 'linear-gradient(145deg, #9B5CF0, #7B3CD8)',
    pillColor: '#9B5CF0',
  },
  workshop: {
    label: 'เวิร์กช็อป',
    gradient: 'linear-gradient(145deg, #2FC3A6, #1BA88D)',
    pillColor: '#2FC3A6',
  },
  hackathon: {
    label: 'แฮกกาธอน',
    gradient: 'linear-gradient(145deg, #EC5F92, #BD7CEE)',
    pillColor: '#EC5F92',
  },
  open_house: {
    label: 'เปิดบ้าน (Open House)',
    gradient: 'linear-gradient(145deg, #5D5683, #3A3263)',
    pillColor: '#5D5683',
  },
};

export function gradientOf(category: Category): string {
  return CATEGORIES[category]?.gradient || 'linear-gradient(145deg, #EE4B8B, #9B5CF0)';
}
