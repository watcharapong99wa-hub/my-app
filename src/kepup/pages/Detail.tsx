"use client";

import { useParams, useRouter } from "next/navigation";
import { setReviewState } from "../lib/reviewState";
import { CATEGORIES, gradientOf } from "../lib/categories";
import {
  countdownLabel,
  feeLabel,
  gradeLabel,
  teamLabel,
  thaiLong,
  thaiRange,
  urgencyOf,
  LOCATION_LABELS,
} from "../lib/format";
import { downloadIcs, googleCalendarUrl } from "../lib/calendar";
import { shelf, useShelf } from "../lib/store";
import { Glass } from "../components/primitives";
import { useUI } from "../components/ui";
import { IconArrow, IconCalendar, IconCheck } from "../components/Icons";
import type { Status } from "../types";

const STATUSES: { value: Status; label: string }[] = [
  { value: "saved", label: "บันทึกไว้" },
  { value: "interested", label: "สนใจ" },
  { value: "applying", label: "กำลังสมัคร" },
  { value: "submitted", label: "ส่งแล้ว" },
];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="drow">
      <span className="label">{label}</span>
      <span style={{ fontSize: 14.5, color: "var(--ink)" }}>{value}</span>
    </div>
  );
}

export function Detail() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : undefined;
  const router = useRouter();
  const ui = useUI();
  useShelf(); // re-render when the shelf changes
  const o = id ? shelf.get(id) : undefined;

  if (!o) {
    return (
      <div className="app" style={{ paddingBlock: 40, minHeight: "100dvh" }}>
        <Glass strong style={{ padding: 24, textAlign: "center" }}>
          <p style={{ fontWeight: 600 }}>ไม่พบรายการนี้</p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => router.push("/app")}>
            กลับไปชั้นวาง
          </button>
        </Glass>
      </div>
    );
  }

  const gcal = googleCalendarUrl(o);
  const urgent = urgencyOf(o.deadlineAt);

  return (
    <div className="app" style={{ paddingBlock: "20px 36px", minHeight: "100dvh", gap: 14 }}>
      <div className="flex items-center justify-between">
        <button className="btn-ghost" onClick={() => router.push("/app")}>
          ← ชั้นวาง
        </button>
        <div className="flex" style={{ gap: 8 }}>
          <button
            className="btn-ghost"
            onClick={() => {
              setReviewState({ draft: o, editing: true });
              router.push("/review");
            }}
          >
            แก้ไข
          </button>
          <button
            className="btn-ghost"
            style={{ color: "#A6322A" }}
            onClick={async () => {
              const ok = await ui.confirm({
                title: "ลบรายการนี้?",
                body: `“${o.title}” จะหายไปจากชั้นวาง และกู้คืนไม่ได้`,
                confirmLabel: "ลบ",
                destructive: true,
              });
              if (!ok) return;
              shelf.remove(o.id);
              router.replace("/app");
              ui.toast("ลบออกจากชั้นวางแล้ว", "info");
            }}
          >
            ลบ
          </button>
        </div>
      </div>

      <Glass strong style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ background: gradientOf(o.category), padding: "15px 20px", color: "#fff" }}>
          <div className="flex items-center justify-between gap-3">
            <span style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.95 }}>
              {CATEGORIES[o.category].label}
            </span>
            {o.deadlineAt && (
              <span
                className="pill"
                style={{ background: "rgba(255,255,255,.26)", color: "#fff" }}
              >
                {countdownLabel(o.deadlineAt)}
              </span>
            )}
          </div>
          <h1 style={{ marginTop: 9, fontSize: 21, fontWeight: 700, lineHeight: 1.3 }}>
            {o.title}
          </h1>
          {o.organizer && (
            <p style={{ marginTop: 4, fontSize: 13, opacity: 0.92 }}>{o.organizer}</p>
          )}
        </div>

        <div style={{ padding: "16px 20px 20px", display: "grid", gap: 13 }}>
          {o.summary && (
            <p className="lede" style={{ fontSize: 14, lineHeight: 1.6 }}>
              {o.summary}
            </p>
          )}

          <Row
            label="วันปิดรับสมัคร"
            value={
              o.deadlineAt ? (
                <>
                  {thaiLong(o.deadlineAt)}
                  {o.deadlineIsEstimated && (
                    <span className="muted"> · คาดการณ์ ควรเช็กอีกครั้ง</span>
                  )}
                </>
              ) : (
                <span className="muted">ยังไม่พบวันปิดรับ</span>
              )
            }
          />

          {o.eventStartAt && (
            <Row label="วันจัดกิจกรรม" value={thaiRange(o.eventStartAt, o.eventEndAt ?? null)} />
          )}

          <Row label="ค่าสมัคร" value={feeLabel(o.isFree, o.feeAmount, o.feeUnit)} />
          <Row label="ประเภท" value={teamLabel(o.teamMin, o.teamMax)} />
          <Row label="ระดับชั้น" value={gradeLabel(o.gradeLevels)} />
          <Row
            label="สถานที่"
            value={
              o.locationType === "online"
                ? LOCATION_LABELS.online
                : [o.venue, o.province].filter(Boolean).join(" · ") ||
                  LOCATION_LABELS[o.locationType]
            }
          />

          {o.requiredDocs.length > 0 && (
            <Row
              label="เอกสารที่ต้องใช้"
              value={
                <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {o.requiredDocs.map((d) => (
                    <span key={d} className="chip">
                      {d}
                    </span>
                  ))}
                </span>
              }
            />
          )}
        </div>
      </Glass>

      {/* status */}
      <Glass strong style={{ padding: 16 }}>
        <span className="label">สถานะการสมัคร</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              className="btn-ghost tap"
              data-on={o.status === s.value}
              onClick={() => {
                if (o.status === s.value) return;
                shelf.update(o.id, { status: s.value });
                ui.toast(`เปลี่ยนสถานะเป็น “${s.label}”`);
              }}
            >
              {o.status === s.value && <IconCheck size={13} />} {s.label}
            </button>
          ))}
        </div>
      </Glass>

      {/* the payoff */}
      {o.deadlineAt && (
        <Glass strong style={{ padding: 16 }}>
          <span className="label">
            <IconCalendar size={13} /> เตือนก่อนหมดเขต
          </span>
          <p className="muted" style={{ marginTop: 5 }}>
            เพิ่มเข้าปฏิทินพร้อมเตือนล่วงหน้า 1 วัน
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 11, flexWrap: "wrap" }}>
            {gcal && (
              <a
                className="btn-primary"
                style={{ flex: "1 1 170px", padding: "13px 18px", fontSize: 14 }}
                href={gcal}
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Calendar <IconArrow size={15} />
              </a>
            )}
            <button
              className="btn-ghost tap"
              style={{ flex: "1 1 110px", justifyContent: "center", padding: "13px 18px" }}
              onClick={() => {
                downloadIcs(o);
                ui.toast("ดาวน์โหลดไฟล์ปฏิทินแล้ว");
              }}
            >
              ดาวน์โหลด .ics
            </button>
          </div>
          {urgent === "now" && (
            <p style={{ marginTop: 11, fontSize: 13, fontWeight: 600, color: "#A6322A" }}>
              เหลือเวลาไม่ถึง 3 วันแล้ว
            </p>
          )}
        </Glass>
      )}

      {o.applyUrl && (
        <a
          className="btn-primary"
          style={{ width: "100%" }}
          href={o.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          ไปหน้าสมัคร <IconArrow />
        </a>
      )}
    </div>
  );
}
