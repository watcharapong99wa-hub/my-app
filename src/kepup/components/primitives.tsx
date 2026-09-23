import React from 'react';
import type { Category, FieldState } from '../types';
import { CATEGORIES } from '../lib/categories';

/** Honesty badge: was this field found in the source, guessed, or missing? */
export function FieldBadge({ state }: { state: FieldState }) {
  const style: React.CSSProperties =
    state === 'found'
      ? { background: 'rgba(46, 125, 50, .12)', color: '#2E7D32' }
      : state === 'inferred'
      ? { background: 'rgba(224, 161, 75, .18)', color: '#9A6B1A' }
      : { background: 'rgba(92,72,130,.1)', color: 'var(--ink-3)' };
  const label = state === 'found' ? 'พบในต้นฉบับ' : state === 'inferred' ? 'ต้องตรวจสอบ' : 'ไม่ระบุ';
  return (
    <span className="chip" style={{ fontSize: 11, ...style }}>
      {label}
    </span>
  );
}

export interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  radius?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export const Glass: React.FC<GlassProps> = ({
  strong,
  radius,
  className = '',
  style,
  children,
  ...props
}) => {
  const classes = [
    'glass',
    strong ? 'glass-strong' : '',
    radius ? `glass-${radius}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style} {...props}>
      {children}
    </div>
  );
};

export function CategoryPill({
  category,
  solid,
  style,
}: {
  category: Category;
  solid?: boolean;
  style?: React.CSSProperties;
}) {
  const meta = CATEGORIES[category] || {
    label: category,
    pillColor: '#EE4B8B',
    gradient: 'linear-gradient(145deg, #EE4B8B, #9B5CF0)',
  };

  if (solid) {
    return (
      <span
        className="pill"
        style={{
          background: meta.gradient,
          color: '#fff',
          boxShadow: '0 4px 12px -4px rgba(88, 38, 96, 0.35)',
          ...style,
        }}
      >
        {meta.label}
      </span>
    );
  }

  return (
    <span
      className="pill"
      style={{
        background: 'rgba(255, 255, 255, 0.65)',
        color: 'var(--ink)',
        border: '1px solid rgba(255, 255, 255, 0.7)',
        ...style,
      }}
    >
      <i
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: meta.pillColor,
          display: 'inline-block',
        }}
      />
      {meta.label}
    </span>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (val: T) => void;
}) {
  return (
    <div className="seg" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          data-active={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Bubble({
  size,
  gradient,
  label,
  value,
  className = '',
  style,
}: {
  size: number;
  gradient: string;
  label: string;
  value: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bubble ${className}`}
      style={{
        width: size,
        height: size,
        background: gradient,
        ...style,
      }}
    >
      <div>
        <div style={{ fontSize: size > 100 ? 24 : 18, fontWeight: 700 }} className="num">
          {value}
        </div>
        <div style={{ fontSize: size > 100 ? 12 : 10.5, opacity: 0.95 }}>
          {label}
        </div>
      </div>
    </div>
  );
}
