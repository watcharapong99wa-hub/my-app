import React, { useState, useMemo } from 'react';
import type { Opportunity } from '../types';
import { TH_MONTHS_FULL, TH_WEEKDAYS_SHORT, toBE, countdownLabel, urgencyOf } from '../lib/format';
import { CATEGORIES } from '../lib/categories';
import { Glass, CategoryPill } from './primitives';

interface CalendarViewProps {
  items: Opportunity[];
  onOpen: (o: Opportunity) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ items, onOpen }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [pickedDate, setPickedDate] = useState<Date | null>(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar grid calculations
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = new Date().toDateString();
    const pickedStr = pickedDate ? pickedDate.toDateString() : '';

    const days = [];

    // Previous month filler
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date: d,
        dayNum: d.getDate(),
        outside: true,
        isToday: d.toDateString() === todayStr,
        isPicked: d.toDateString() === pickedStr,
      });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dayNum: i,
        outside: false,
        isToday: d.toDateString() === todayStr,
        isPicked: d.toDateString() === pickedStr,
      });
    }

    // Next month filler up to multiple of 7
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dayNum: i,
        outside: true,
        isToday: d.toDateString() === todayStr,
        isPicked: d.toDateString() === pickedStr,
      });
    }

    return days;
  }, [year, month, pickedDate]);

  // Match items for each date
  const getItemsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return items.filter((o) => {
      if (!o.deadlineAt) return false;
      return new Date(o.deadlineAt).toDateString() === dateStr;
    });
  };

  const pickedItems = pickedDate ? getItemsForDate(pickedDate) : [];

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Month header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="muted num" style={{ letterSpacing: '0.04em' }}>
            พ.ศ. {toBE(year)}
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>
            {TH_MONTHS_FULL[month]}
          </h2>
        </div>
        <div className="flex" style={{ gap: 6 }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '8px 12px' }}
            aria-label="เดือนก่อนหน้า"
            onClick={prevMonth}
          >
            ←
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '8px 12px' }}
            aria-label="เดือนถัดไป"
            onClick={nextMonth}
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar Month Grid */}
      <Glass strong style={{ padding: 14 }}>
        {/* Weekday headers */}
        <div className="cal-grid" style={{ marginBottom: 6 }}>
          {TH_WEEKDAYS_SHORT.map((wd) => (
            <div key={wd} className="cal-head">
              {wd}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="cal-grid">
          {calendarDays.slice(0, 35).map((cell, idx) => {
            const hits = getItemsForDate(cell.date);
            return (
              <button
                key={idx}
                type="button"
                className="cal-cell tap"
                data-outside={cell.outside}
                data-today={cell.isToday}
                data-picked={cell.isPicked}
                onClick={() => setPickedDate(cell.date)}
              >
                <span>{cell.dayNum}</span>
                <span className="cal-dots">
                  {hits.slice(0, 3).map((item, i) => (
                    <i
                      key={i}
                      style={{
                        background: CATEGORIES[item.category]?.pillColor || '#EE4B8B',
                      }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </Glass>

      {/* Selected day items list */}
      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="h2" style={{ fontSize: 16 }}>
            {pickedDate ? (
              <>
                วันที่ {pickedDate.getDate()} {TH_MONTHS_FULL[pickedDate.getMonth()]}
              </>
            ) : (
              'รายการที่เลือก'
            )}
          </h3>
          <span className="muted">
            {pickedItems.length > 0 ? `${pickedItems.length} รายการ` : 'ไม่มีวันปิดรับ'}
          </span>
        </div>

        <div style={{ display: 'grid', gap: 9, marginTop: 10 }}>
          {pickedItems.length === 0 ? (
            <Glass style={{ padding: 18, textAlign: 'center' }}>
              <p className="muted">ไม่มีเดดไลน์ปิดรับสมัครในวันนี้</p>
            </Glass>
          ) : (
            pickedItems.map((o) => {
              const urgent = urgencyOf(o.deadlineAt);
              return (
                <Glass
                  key={o.id}
                  className="tap"
                  style={{ padding: '13px 15px', cursor: 'pointer' }}
                  onClick={() => onOpen(o)}
                >
                  <div className="flex items-center justify-between">
                    <CategoryPill category={o.category} />
                    {o.deadlineAt && (
                      <span
                        className={`pill ${
                          urgent === 'now'
                            ? 'urgent-now'
                            : urgent === 'soon'
                            ? 'urgent-soon'
                            : 'urgent-calm'
                        }`}
                        style={{ fontSize: 10.5 }}
                      >
                        {countdownLabel(o.deadlineAt)}
                      </span>
                    )}
                  </div>
                  <h4 style={{ marginTop: 8, fontSize: 14.5, fontWeight: 600 }}>
                    {o.title}
                  </h4>
                  {o.organizer && (
                    <p className="muted" style={{ marginTop: 2, fontSize: 12 }}>
                      {o.organizer}
                    </p>
                  )}
                </Glass>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
