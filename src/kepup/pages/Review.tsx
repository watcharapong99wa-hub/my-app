"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { takeReviewState } from "../lib/reviewState";
import type { Category, Opportunity } from "../types";
import { CATEGORIES } from "../lib/categories";
import {
  countdownLabelDeadline,
  deadlineDateText,
  deadlineTimeText,
} from "../lib/format";
import { shelf } from "../lib/store";
import { FieldBadge, Glass, CategoryPill } from "../components/primitives";
import { useUI } from "../components/ui";
import { IconCheck, IconSparkle } from "../components/Icons";

const LOW = 0.8;

/** Split date/time inputs: a missing time stays missing, never defaulted. */
function datePart(iso: string | null): string {
  if (!iso) return "";
  const m = iso.slice(0, 10).match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

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
  const [confirmed, setConfirmed] = useState(false);

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
  const uncertain = flagged > 0 || draft.needsReview;

  function save() {
    const title = card.title.trim();
    if (!title) return;
    const final = {
      ...card,
      title,
      needsReview:
        card.deadlineState !== "found" || card.applyUrlState !== "found",
    };
    if (editing) {
      shelf.update(card.id, final);
      router.replace(`/card/${card.id}`);
      ui.toast("บันทึกการแก้ไขแล้ว");
      return;
    }
    shelf.add(final);
    router.replace("/app");
    if (state?.meta?.usedFallback || final.needsReview) {
      ui.toast("บันทึกแล้ว · อย่าลืมตรวจสอบวันปิดรับและลิงก์กับต้นฉบับ", "info");
    } else {
      ui.toast(
        card.deadlineAt
          ? `บันทึกแล้ว · ${countdownLabelDeadline(card)}`
          : "บันทึกลงชั้นวางแล้ว"
      );
    }
  }

  const mustConfirm =
    !editing &&
    (card.deadlineState !== "found" || card.applyUrlState !== "found");
  const canSave = draft.title.trim() && (!mustConfirm || confirmed);

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
            <IconSparkle size={14} /> AI ใช้ไม่ได้ — อ่านจากข้อความเท่านั้น
          </p>
          <p className="muted" style={{ marginTop: 3 }}>
            ระบบจะไม่เดาวันปิดรับ ลิงก์ หรือเอกสาร
            {state.meta.found?.length
              ? ` พบ ${state.meta.found.length} ข้อมูล`
              : " ไม่พบข้อมูลสำคัญ"}{" "}
            — เทียบกับต้นฉบับด้านล่างก่อนบันทึก
          </p>
        </Glass>
      )}

      {!editing && !state?.manual && !state?.meta?.usedFallback && (
        <Glass
          strong
          style={{
            padding: "13px 16px",
            borderLeft: `3px solid ${uncertain ? "#E0A14B" : "#2FC3A6"}`,
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 600 }}>
            {uncertain ? (
              <>
                <IconSparkle size={14} />{" "}
                {flagged > 0
                  ? `AI ไม่แน่ใจ ${flagged} ข้อมูล`
                  : "ข้อมูลบางส่วนต้องตรวจสอบ"}
                {draft.needsReview ? " · วันปิดรับ/ลิงก์ต้องตรวจสอบ" : ""}
              </>
            ) : (
              <>
                <IconCheck size={14} /> AI อ่านครบทุกข้อมูล
              </>
            )}
          </p>
          <p className="muted" style={{ marginTop: 3 }}>
            {uncertain
              ? "ช่องที่มีสีเหลืองคือช่องที่ควรเช็กก่อนบันทึก"
              : "ดูอีกรอบแล้วกดบันทึกได้เลย"}
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

      {(draft.originalUrl || draft.originalText || draft.hasOriginalImage) && (
        <Glass strong style={{ padding: "13px 16px" }}>
          <span className="label">ต้นฉบับที่มา — เทียบก่อนบันทึก</span>
          <div style={{ display: "grid", gap: 8, marginTop: 9 }}>
            {draft.originalUrl && (
              <a
                className="btn-ghost"
                style={{ justifyContent: "center" }}
                href={draft.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                เปิดต้นฉบับ
              </a>
            )}
            {draft.hasOriginalImage && (
              <p className="muted" style={{ fontSize: 12.5 }}>
                ดึงจากภาพสกรีนช็อตที่อัปโหลด
              </p>
            )}
            {draft.originalText && (
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  color: "var(--ink-2)",
                  background: "rgba(255,255,255,.5)",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                {draft.originalText}
              </p>
            )}
          </div>
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
          low={lowDeadline || draft.deadlineState !== "found"}
          hint={
            draft.deadlineAt
              ? `${deadlineDateText(draft)} · ${deadlineTimeText(draft)} · ${countdownLabelDeadline(draft)}${
                  draft.deadlineIsEstimated ? " · เป็นวันที่คาดการณ์" : ""
                }`
              : "ยังไม่มีวันปิดรับ — ใส่เองได้ หรือเว้นไว้"
          }
        >
          <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap" }}>
            <FieldBadge state={draft.deadlineState} />
          </div>
          <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <input
              id="rf-deadline"
              className="field"
              type="date"
              style={{ flex: "1 1 150px" }}
              value={datePart(draft.deadlineAt)}
              onChange={(e) => {
                const d = e.target.value;
                if (!d) {
                  set("deadlineAt", null);
                  setDraft((x) =>
                    x ? { ...x, deadlineTime: null, deadlineState: "missing", deadlineIsEstimated: false } : x
                  );
                  return;
                }
                const t = draft.deadlineTime ?? "00:00";
                set("deadlineAt", `${d}T${t}:00+07:00`);
                setDraft((x) =>
                  x ? { ...x, deadlineState: "found", deadlineIsEstimated: false } : x
                );
              }}
            />
            <input
              id="rf-deadline-time"
              className="field"
              type="time"
              style={{ width: 120 }}
              value={draft.deadlineTime ?? ""}
              onChange={(e) => {
                const t = e.target.value || null;
                const d = datePart(draft.deadlineAt);
                if (!d) return;
                set("deadlineAt", `${d}T${t ?? "00:00"}:00+07:00`);
                setDraft((x) =>
                  x ? { ...x, deadlineTime: t, deadlineState: "found", deadlineIsEstimated: false } : x
                );
              }}
            />
            {draft.deadlineTime && (
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => {
                  const d = datePart(draft.deadlineAt);
                  if (!d) return;
                  set("deadlineAt", `${d}T00:00:00+07:00`);
                  setDraft((x) => (x ? { ...x, deadlineTime: null } : x));
                }}
              >
                ไม่ระบุเวลา
              </button>
            )}
          </div>
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
          <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
            <FieldBadge state={draft.applyUrlState} />
          </div>
          <input
            id="rf-url"
            className="field"
            type="url"
            value={draft.applyUrl ?? ""}
            placeholder="https:// — เว้นว่างได้ถ้ายังไม่มี"
            onChange={(e) => {
              const v = e.target.value || null;
              set("applyUrl", v);
              setDraft((x) =>
                x ? { ...x, applyUrlState: v ? "found" : "missing" } : x
              );
            }}
          />
        </Field>
      </Glass>

      {mustConfirm && (
        <Glass strong style={{ padding: "13px 16px", borderLeft: "3px solid #E0A14B" }}>
          <label
            className="flex items-center"
            style={{ gap: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "#9A6B1A" }}
            />
            ฉันตรวจสอบวันปิดรับและลิงก์สมัครกับต้นฉบับแล้ว
          </label>
          <p className="muted" style={{ marginTop: 6 }}>
            ระบบไม่บันทึกข้อมูลที่ยังไม่ได้ตรวจสอบโดยไม่ได้รับความยินยอม
          </p>
        </Glass>
      )}

      <button
        className="btn-primary"
        style={{ width: "100%", opacity: canSave ? 1 : 0.55 }}
        disabled={!canSave}
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
      {draft.title.trim() !== "" && mustConfirm && !confirmed && (
        <p className="muted" style={{ textAlign: "center" }}>
          ติ๊กยืนยันด้านบนก่อนบันทึก
        </p>
      )}
    </div>
  );
}
