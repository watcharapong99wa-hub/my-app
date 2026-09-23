import React from 'react';
import type { Opportunity } from '../types';
import { CATEGORIES, gradientOf } from '../lib/categories';
import { countdownLabel, urgencyOf, thaiLong, feeLabel } from '../lib/format';
import { Glass, CategoryPill } from './primitives';

export function FeaturedCard({
  o,
  onOpen,
}: {
  o: Opportunity;
  onOpen: (o: Opportunity) => void;
}) {
  const urgent = urgencyOf(o.deadlineAt);

  return (
    <Glass
      strong
      className="tap"
      style={{
        padding: 0,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={() => onOpen(o)}
    >
      <div
        style={{
          background: gradientOf(o.category),
          padding: '16px 20px',
          color: '#fff',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.95 }}>
            {CATEGORIES[o.category]?.label || o.category}
          </span>
          {o.deadlineAt && (
            <span
              className={`pill ${
                urgent === 'now'
                  ? 'urgent-now'
                  : urgent === 'soon'
                  ? 'urgent-soon'
                  : 'urgent-calm'
              }`}
            >
              {countdownLabel(o.deadlineAt)}
            </span>
          )}
        </div>
        <h3
          style={{
            marginTop: 8,
            fontSize: 18.5,
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#fff',
          }}
        >
          {o.title}
        </h3>
        {o.organizer && (
          <p
            style={{
              marginTop: 4,
              fontSize: 12.5,
              opacity: 0.9,
              color: 'rgba(255, 255, 255, 0.92)',
            }}
          >
            {o.organizer}
          </p>
        )}
      </div>

      <div style={{ padding: '14px 18px', display: 'grid', gap: 6 }}>
        {o.summary && (
          <p
            className="lede"
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {o.summary}
          </p>
        )}

        <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
          <span className="muted" style={{ fontSize: 12 }}>
            {o.deadlineAt ? thaiLong(o.deadlineAt) : 'ไม่ระบุวันปิดรับ'}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
            {feeLabel(o.isFree, o.feeAmount, o.feeUnit)}
          </span>
        </div>
      </div>
    </Glass>
  );
}

export function OpportunityCard({
  o,
  onOpen,
}: {
  o: Opportunity;
  onOpen: (o: Opportunity) => void;
}) {
  const urgent = urgencyOf(o.deadlineAt);

  return (
    <Glass
      className="tap"
      style={{
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'grid',
        gap: 8,
      }}
      onClick={() => onOpen(o)}
    >
      <div className="flex items-center justify-between gap-2">
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
            style={{ fontSize: 11 }}
          >
            {countdownLabel(o.deadlineAt)}
          </span>
        )}
      </div>

      <div>
        <h4
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--ink)',
            lineHeight: 1.35,
          }}
        >
          {o.title}
        </h4>
        {o.organizer && (
          <p className="muted" style={{ marginTop: 2, fontSize: 12 }}>
            {o.organizer}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
        <span className="muted" style={{ fontSize: 11.5 }}>
          {o.deadlineAt ? thaiLong(o.deadlineAt) : 'ยังไม่มีวันปิดรับ'}
        </span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)' }}>
          {o.isFree ? 'ฟรี' : o.feeAmount ? `${o.feeAmount} บ.` : 'ไม่ระบุ'}
        </span>
      </div>
    </Glass>
  );
}
