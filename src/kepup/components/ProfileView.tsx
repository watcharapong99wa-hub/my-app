import React from 'react';
import type { Opportunity, AuthSession } from '../types';
import { initialOf } from '../lib/auth';
import { GRADE_LABELS, daysUntilDeadline } from '../lib/format';
import { shelf } from '../lib/store';
import { Glass } from './primitives';
import { useUI } from './ui';

interface ProfileViewProps {
  session: AuthSession;
  items: Opportunity[];
  onSignOut: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  session,
  items,
  onSignOut,
}) => {
  const ui = useUI();

  const total = items.length;
  const applying = items.filter((o) => o.status === 'applying' || o.status === 'submitted').length;
  const dueSoon = items.filter((o) => {
    if (!o.deadlineAt) return false;
    const d = daysUntilDeadline(o);
    return d >= 0 && d <= 7;
  }).length;

  const handleReset = async () => {
    const ok = await ui.confirm({
      title: 'ลบข้อมูลทั้งหมด?',
      body: 'รายการที่บันทึกไว้ทั้งหมดจะถูกลบออกจากเครื่องนี้ และกู้คืนไม่ได้',
      confirmLabel: 'ลบทั้งหมด',
      destructive: true,
    });
    if (ok) {
      shelf.reset();
      ui.toast('ลบข้อมูลทั้งหมดแล้ว', 'info');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Profile Card */}
      <Glass strong style={{ padding: 20, textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: '0 auto',
            borderRadius: 22,
            display: 'grid',
            placeItems: 'center',
            fontSize: 26,
            fontWeight: 700,
            color: '#fff',
            background: 'linear-gradient(160deg,#FF9A4D,#EE4B8B 55%,#9B5CF0)',
            boxShadow: '0 12px 24px -10px rgba(238,75,139,.6)',
          }}
        >
          {initialOf(session.name)}
        </div>

        <h3 style={{ marginTop: 12, fontSize: 20, fontWeight: 700 }}>
          {session.name}
        </h3>

        {session.grade && (
          <span
            className="pill"
            style={{
              marginTop: 6,
              background: 'rgba(255,255,255,0.7)',
              color: 'var(--ink)',
            }}
          >
            ชั้น {GRADE_LABELS[session.grade] || session.grade}
          </span>
        )}
      </Glass>

      {/* Stats Summary */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <Glass style={{ padding: '14px 10px', textAlign: 'center' }}>
          <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>
            {total}
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
            ในชั้นวาง
          </div>
        </Glass>

        <Glass style={{ padding: '14px 10px', textAlign: 'center' }}>
          <div
            className="num"
            style={{ fontSize: 22, fontWeight: 700, color: '#EE4B8B' }}
          >
            {dueSoon}
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
            ปิดรับใน 7 วัน
          </div>
        </Glass>

        <Glass style={{ padding: '14px 10px', textAlign: 'center' }}>
          <div
            className="num"
            style={{ fontSize: 22, fontWeight: 700, color: '#9B5CF0' }}
          >
            {applying}
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
            กำลังสมัคร
          </div>
        </Glass>
      </div>

      {/* Settings & Backup */}
      <Glass strong style={{ padding: 16, display: 'grid', gap: 10 }}>
        <span className="label">การจัดการข้อมูล · โปรไฟล์ในเครื่องนี้</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ justifyContent: 'center', flex: 1 }}
            onClick={() => {
              shelf.exportBackup();
              ui.toast('ดาวน์โหลดไฟล์สำรองแล้ว', 'info');
            }}
          >
            สำรองข้อมูล
          </button>
          <label
            className="btn-ghost"
            style={{ justifyContent: 'center', flex: 1, cursor: 'pointer' }}
          >
            นำเข้าข้อมูล
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                try {
                  const n = await shelf.importBackup(f);
                  ui.toast(`นำเข้าข้อมูลแล้ว ${n} รายการ`, 'info');
                } catch (err) {
                  ui.toast(
                    err instanceof Error ? err.message : 'นำเข้าไม่สำเร็จ',
                    'warn'
                  );
                }
              }}
            />
          </label>
        </div>
        <button
          type="button"
          className="btn-ghost"
          style={{ justifyContent: 'center', width: '100%' }}
          onClick={handleReset}
        >
          ลบข้อมูลทั้งหมด
        </button>
        <button
          type="button"
          className="btn-ghost"
          style={{ justifyContent: 'center', width: '100%', color: '#A6322A' }}
          onClick={onSignOut}
        >
          ออกจากระบบ / สลับบัญชี
        </button>
        <p className="muted" style={{ fontSize: 11.5, lineHeight: 1.7, textAlign: 'center' }}>
          โปรไฟล์คือชื่อในเครื่องนี้ ไม่ใช่บัญชีผู้ใช้ ·
          ออกจากระบบแล้วข้อมูลในชั้นวางยังอยู่ ·
          ล้างข้อมูลเบราว์เซอร์จะลบทุกอย่าง — สำรองไว้ก่อน
        </p>
      </Glass>
    </div>
  );
};
