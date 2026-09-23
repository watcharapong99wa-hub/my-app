import React from 'react';

export type Tab = 'shelf' | 'due' | 'calendar' | 'profile';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  onCapture: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  active,
  onChange,
  onCapture,
}) => {
  return (
    <nav className="dock" aria-label="แถบนำทางหลัก">
      <div className="dock-bar">
        {/* Tab 1: Shelf */}
        <button
          type="button"
          className="dock-btn"
          data-active={active === 'shelf'}
          aria-label="ชั้นวาง"
          onClick={() => onChange('shelf')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1.5" />
            <rect width="7" height="7" x="14" y="3" rx="1.5" />
            <rect width="7" height="7" x="14" y="14" rx="1.5" />
            <rect width="7" height="7" x="3" y="14" rx="1.5" />
          </svg>
        </button>

        {/* Tab 2: Due Soon */}
        <button
          type="button"
          className="dock-btn"
          data-active={active === 'due'}
          aria-label="ใกล้ปิดรับ"
          onClick={() => onChange('due')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>

        {/* Spacer for Floating Action Button */}
        <div style={{ width: 48 }} />

        {/* Tab 3: Calendar */}
        <button
          type="button"
          className="dock-btn"
          data-active={active === 'calendar'}
          aria-label="ปฏิทิน"
          onClick={() => onChange('calendar')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        </button>

        {/* Tab 4: Profile */}
        <button
          type="button"
          className="dock-btn"
          data-active={active === 'profile'}
          aria-label="โปรไฟล์"
          onClick={() => onChange('profile')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>

        {/* Floating Action Button (FAB) */}
        <button
          type="button"
          className="fab tap"
          aria-label="บันทึกโอกาสใหม่"
          onClick={onCapture}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </nav>
  );
};
