"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { takeReviewState } from "../lib/reviewState";
import type { Category, Opportunity } from "../types";
import { CATEGORIES } from "../lib/categories";
import { countdownLabel, thaiLong } from "../lib/format";
import { shelf } from "../lib/store";
import { Glass, CategoryPill } from "../components/primitives";
import { useUI } from "../components/ui";
import { IconCheck, IconSparkle } from "../components/Icons";

const LOW = 0.8;

/** A datetime-local input wants "YYYY-MM-DDTHH:mm" in local wall time. */
function toInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}
const fromInput = (v: string) => (v ? new Date(v).toISOString() : null);

function Field({
  label,
  low,
  children,
  hint,
}: {
  label: string;
  low?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rf${low ? " rf-low" : ""}`}>
      <div className="flex items-center justify-between" style={{ gap: 8 }}>
        <span className="label">{label}</span>
        {low && (
          <span className="pill urgent-soon" style={{ fontSize: 10.5 }}>
            ตรวจสอบ
          </span>
        )}
      </div>
      {children}
      {hint && (
        <p className="muted" style={{ marginTop: 5 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function Review() {
  const router = useRouter();
  const ui = useUI();
  const [initialState] = useState(takeReviewState);
  const state = initialState;

  const [draft, setDraft] = useState<Opportunity | null>(state?.draft ?? null);

  const editing = Boolean(state?.editing);

  const dupe = useMemo(() => {
    if (!draft || editing) return undefined;
    return shelf.findDuplicate(draft.title, draft.deadlineAt);
  }, [draft, editing]);

  if (!draft) {
    return (
      <div className="app" style={{ paddingBlock: 40, minHeight: "100dvh", gap: 14 }}>
        <Glass strong style={{ padding: 24, textAlign: "center" }}>
          <p style={{ fontWeight: 600 }}>ไม่พบข้อมูลที่จะตรวจสอบ</p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => router.push("/capture")}>
            เริ่มบันทึกใหม่
          </button>
        </Glass>
      </div>
    );
  }

  // narrowing from the guard above does not survive into the callbacks below
  const card: Opportunity = draft;

  const set = <K extends keyof Opportunity>(k: K, v: Opportunity[K]) =>
    setDraft({ ...card, [k]: v });

  const c = draft.confidence;
  const lowTitle = (c.title ?? 1) < LOW;
  const lowDeadline = (c.deadlineAt ?? 1) < LOW;
  const lowCategory = (c.category ?? 1) < LOW;
  const lowFee = (c.fee ?? 1) < LOW;
  const flagged = [lowTitle, lowDeadline, lowCategory, lowFee].filter(Boolean).length;

  function save() {
    const title = card.title.trim();
    if (!title) return;
    if (editing) {
      shelf.update(card.id, { ...card, title });
      router.replace(`/card/${card.id}`);
      ui.toast("บันทึกการแก้ไขแล้ว");
      return;
    }
    shelf.add({ ...card, title });
    router.replace("/app");
    ui.toast(
      card.deadlineAt
        ? `บันทึกแล้ว · ${countdownLabel(card.deadlineAt)}`
        : "บันทึกลงชั้นวางแล้ว"
    );
  }

  return (
    <div className="app" style={{ paddingBlock: "20px 32px", minHeight: "100dvh", gap: 14 }}>
      <div className="flex items-center justify-between">
        <button className="btn-ghost" onClick={() => router.back()}>
          ← กลับ
        </button>
        <span className="label">
          {editing ? "แก้ไขรายการ" : state?.manual ? "กรอกเอง" : "ตรวจสอบก่อนบันทึก"}
        </span>
      </div>

      {!editing && !state?.manual && state?.meta?.usedFallback && (
        <Glass strong style={{ padding: "13px 16px", borderLeft: "3px solid #E0A14B" }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>
            <IconSparkle size={14} /> อ่านแบบออฟไลน์ให้แล้ว
          </p>
          <p className="muted" style={{ marginTop: 3 }}>
            ตอนนี้ AI ใช้ไม่ได้ ระบบจึงอ่านวันที่และตัวเลขจากข้อความเอง
            {state.meta.found?.length
              ? ` พบ ${state.meta.found.length} ข้อมูล`
              : ""}{" "}
            — ช่วยตรวจดูให้ครบก่อนบันทึก
          </p>
        </Glass>
      )}

      {!editing && !state?.manual && !state?.meta?.usedFallback && (
        <Glass
          strong
          style={{
            padding: "13px 16px",
            borderLeft: `3px solid ${flagged ? "#E0A14B" : "#2FC3A6"}`,
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 600 }}>
            {flagged === 0 ? (
              <>
                <IconCheck size={14} /> AI อ่านครบทุกข้อมูล
              </>
            ) : (
              <>
                <IconSparkle size={14} /> AI ไม่แน่ใจ {flagged} ข้อมูล
              </>
            )}
          </p>
          <p className="muted" style={{ marginTop: 3 }}>
            {flagged === 0
              ? "ดูอีกรอบแล้วกดบันทึกได้เลย"
              : "ช่องที่มีสีเหลืองคือช่องที่ควรเช็กก่อนบันทึก"}
            {state?.meta?.deadlineDisputed && " · วันปิดรับจาก AI ไม่ตรงกับที่เราคำนวณ"}
          </p>
        </Glass>
      )}

      {dupe && (
        <Glass strong style={{ padding: "13px 16px", borderLeft: "3px solid #E4325F" }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>บันทึกรายการนี้ไว้แล้ว</p>
          <p className="muted" style={{ marginTop: 3 }}>
            ชื่อและวันปิดรับตรงกับที่มีอยู่ในชั้นวาง
          </p>
        </Glass>
      )}

      <Glass strong style={{ padding: 16, display: "grid", gap: 14 }}>
        <Field label="ชื่อกิจกรรม" low={lowTitle}>
          <input
            id="rf-title"
            className="field"
            value={draft.title}
            placeholder="เช่น การแข่งขันหุ่นยนต์ระดับมัธยม"
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>

        <Field label="หมวดหมู่" low={lowCategory}>
          <div className="cat-grid">
            {(Object.keys(CATEGORIES) as Category[]).map((k) => (
              <button
                key={k}
                className="cat-opt"
                data-active={draft.category === k}
                onClick={() => set("category", k)}
              >
                <CategoryPill category={k} solid={draft.category === k} />
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="วันปิดรับสมัคร"
          low={lowDeadline}
          hint={
            draft.deadlineAt
              ? `${thaiLong(draft.deadlineAt)} · ${countdownLabel(draft.deadlineAt)}${
                  draft.deadlineIsEstimated ? " · เป็นวันที่คาดการณ์" : ""
                }`
              : "ยังไม่มีวันปิดรับ — ใส่เองได้"
          }
        >
          <input
            id="rf-deadline"
            className="field"
            type="datetime-local"
            value={toInput(draft.deadlineAt)}
            onChange={(e) => {
              set("deadlineAt", fromInput(e.target.value));
              setDraft((d) => (d ? { ...d, deadlineIsEstimated: false } : d));
            }}
          />
        </Field>

        <Field label="ผู้จัด">
          <input
            id="rf-org"
            className="field"
            value={draft.organizer ?? ""}
            placeholder="เช่น คณะวิศวกรรมศาสตร์ ม.เกษตรศาสตร์"
            onChange={(e) => set("organizer", e.target.value || null)}
          />
        </Field>

        <Field label="ค่าสมัคร" low={lowFee}>
          <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn-ghost"
              data-on={draft.isFree}
              onClick={() =>
                setDraft({ ...draft, isFree: !draft.isFree, feeAmount: null })
              }
            >
              {draft.isFree ? "✓ ฟรี" : "ฟรี"}
            </button>
            {!draft.isFree && (
              <>
                <input
                  id="rf-fee"
                  className="field"
                  type="number"
                  min={0}
                  style={{ width: 110 }}
                  value={draft.feeAmount ?? ""}
                  placeholder="บาท"
                  onChange={(e) =>
                    set("feeAmount", e.target.value ? Number(e.target.value) : null)
                  }
                />
                <select
                  id="rf-feeunit"
                  className="field"
                  style={{ width: 110 }}
                  value={draft.feeUnit}
                  onChange={(e) =>
                    set("feeUnit", e.target.value as Opportunity["feeUnit"])
                  }
                >
                  <option value="per_person">ต่อคน</option>
                  <option value="per_team">ต่อทีม</option>
                  <option value="unknown">ไม่ระบุ</option>
                </select>
              </>
            )}
          </div>
        </Field>

        <Field label="ขนาดทีม">
          <div className="flex items-center" style={{ gap: 8 }}>
            <input
              id="rf-tmin"
              className="field"
              type="number"
              min={1}
              style={{ width: 88 }}
              value={draft.teamMin ?? ""}
              onChange={(e) =>
                set("teamMin", e.target.value ? Number(e.target.value) : null)
              }
            />
            <span className="muted">ถึง</span>
            <input
              id="rf-tmax"
              className="field"
              type="number"
              min={1}
              style={{ width: 88 }}
              value={draft.teamMax ?? ""}
              onChange={(e) =>
                set("teamMax", e.target.value ? Number(e.target.value) : null)
              }
            />
            <span className="muted">คน</span>
          </div>
        </Field>

        <Field label="สรุปสั้น ๆ">
          <textarea
            id="rf-summary"
            className="field"
            rows={3}
            value={draft.summary}
            placeholder="รายละเอียดสั้น ๆ ที่อยากจำไว้"
            onChange={(e) => set("summary", e.target.value)}
          />
        </Field>

        <Field label="ลิงก์สมัคร">
          <input
            id="rf-url"
            className="field"
            type="url"
            value={draft.applyUrl ?? ""}
            placeholder="https://"
            onChange={(e) => set("applyUrl", e.target.value || null)}
          />
        </Field>
      </Glass>

      <button
        className="btn-primary"
        style={{ width: "100%", opacity: draft.title.trim() ? 1 : 0.55 }}
        disabled={!draft.title.trim()}
        onClick={save}
      >
        <IconCheck size={16} />
        {editing ? "บันทึกการแก้ไข" : "บันทึกลงชั้นวาง"}
      </button>
      {!draft.title.trim() && (
        <p className="muted" style={{ textAlign: "center" }}>
          ต้องมีชื่อกิจกรรมก่อนถึงจะบันทึกได้
        </p>
      )}
    </div>
  );
}
