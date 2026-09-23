"use client";

import { Glass } from "../components/primitives";
import { IconArrow, IconCheck, IconImage, IconText } from "../components/Icons";
import { TH_MONTHS_SHORT, toBE } from "../lib/format";

/** Countdown ring — the reference's arc widget, carrying a real number. */
function Ring({ days, total = 30 }: { days: number; total?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0.06, Math.min(1, 1 - days / total));
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="rgba(255,255,255,.6)"
        strokeWidth="7"
      />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform="rotate(-90 36 36)"
      />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF6FA5" />
          <stop offset="100%" stopColor="#F5843C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Landing({ onStart }: { onStart: () => void }) {
  const today = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 3);

  return (
    <div
      className="app"
      style={{
        paddingBlock: "22px 26px",
        minHeight: "100dvh",
        justifyContent: "space-between",
        gap: 26,
      }}
    >
      {/* brand */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>
            KepUp
          </span>
          <span className="muted" style={{ color: "rgba(58,50,99,.7)" }}>
            เก็บอัพ
          </span>
        </div>
        <span
          className="label"
          style={{ color: "rgba(58,50,99,.65)", letterSpacing: "0.12em" }}
        >
          v0.1
        </span>
      </div>

      {/* floating preview stack - responsive flow, never overlaps */}
      <div style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {/* saved-card confirmation */}
          <Glass
            strong
            radius="md"
            className="float"
            style={{
              padding: "16px 16px 18px",
            }}
          >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              background: "linear-gradient(150deg,#FF6FA5,#EE4B8B)",
              boxShadow: "0 8px 16px -8px rgba(238,75,139,.8)",
            }}
          >
            <IconCheck size={16} />
          </div>
          <div style={{ marginTop: 13, display: "grid", gap: 7 }}>
            <i
              style={{
                display: "block",
                height: 7,
                width: "84%",
                borderRadius: 99,
                background: "rgba(92,72,130,.28)",
              }}
            />
            <i
              style={{
                display: "block",
                height: 7,
                width: "58%",
                borderRadius: 99,
                background: "rgba(92,72,130,.16)",
              }}
            />
          </div>
          <div className="muted" style={{ marginTop: 12, fontSize: 11.5 }}>
            บันทึกแล้ว 7 วินาที
          </div>
        </Glass>

        {/* countdown ring */}
        <Glass
          radius="md"
          className="float-2"
          style={{
            padding: "14px 14px 16px",
            display: "grid",
            justifyItems: "center",
          }}
        >
          <Ring days={3} />
          <div
            className="num"
            style={{ marginTop: 8, fontSize: 15, fontWeight: 700 }}
          >
            เหลือ 3 วัน
          </div>
          <div className="muted" style={{ fontSize: 11 }}>
            ทุนแลกเปลี่ยน AFS
          </div>
        </Glass>
        </div>

        {/* dated opportunity card with the gradient rail */}
        <Glass
          strong
          className="overflow-hidden"
          style={{
            padding: 0,
            display: "flex",
          }}
        >
          <div
            style={{
              width: 46,
              flex: "none",
              display: "grid",
              placeItems: "center",
              padding: "16px 0",
              background: "linear-gradient(170deg,#FF9A4D,#EE4B8B 55%,#9B5CF0)",
            }}
          >
            <span className="rail">
              {TH_MONTHS_SHORT[soon.getMonth()]} {toBE(soon.getFullYear()) % 100}
            </span>
          </div>
          <div style={{ padding: "15px 18px", minWidth: 0 }}>
            <div
              className="num"
              style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}
            >
              {soon.getDate()}
            </div>
            <div
              className="flex items-center gap-1.5"
              style={{ marginTop: 9, color: "var(--ink-2)", fontSize: 13 }}
            >
              <i
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 99,
                  background: "#EE4B8B",
                  flex: "none",
                }}
              />
              ปิดรับสมัคร 2 รายการ
            </div>
            <div className="muted" style={{ marginTop: 2 }}>
              และอีก 5 รายการเดือนนี้
            </div>
          </div>
        </Glass>
      </div>

      <div className="dots" aria-hidden="true">
        <i data-active="true" />
        <i />
        <i />
      </div>

      {/* pitch */}
      <Glass strong style={{ padding: "26px 24px 24px", textAlign: "center" }}>
        <h1 className="display">
          เก็บทุกโอกาส
          <br />
          ก่อนหมดเขต
        </h1>
        <p className="lede" style={{ marginTop: 12 }}>
          วางโพสต์ แคปหน้าจอ หรือข้อความที่เจอ
          <br />
          แล้วให้ KepUp แยกวันปิดรับให้อัตโนมัติ
        </p>

        <div
          className="flex items-center justify-center gap-2"
          style={{ marginTop: 16 }}
        >
          <span className="chip">
            <IconText size={14} /> วางข้อความ
          </span>
          <span className="chip">
            <IconImage size={14} /> อัปโหลดรูป
          </span>
        </div>

        <button
          className="btn-primary"
          style={{ marginTop: 22, width: "100%" }}
          onClick={onStart}
        >
          เริ่มใช้งาน
          <IconArrow />
        </button>

        <p className="muted" style={{ marginTop: 13, fontSize: 11.5 }}>
          ใช้ได้ฟรี · ข้อมูลของคุณเห็นได้เฉพาะคุณ ·{" "}
          {toBE(today.getFullYear())}
        </p>
      </Glass>
    </div>
  );
}
