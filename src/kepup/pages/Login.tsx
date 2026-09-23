"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Glass } from "../components/primitives";
import { IconArrow, IconCheck } from "../components/Icons";
import { auth } from "../lib/auth";
import { GRADE_LABELS } from "../lib/format";

const GRADES = ["m1", "m2", "m3", "m4", "m5", "m6", "voc"];

export function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0;

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    auth.signIn(name, grade);
    router.replace(next);
  }

  return (
    <div
      className="app"
      style={{
        paddingBlock: "28px 32px",
        minHeight: "100dvh",
        justifyContent: "center",
        gap: 22,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 62,
            height: 62,
            margin: "0 auto",
            borderRadius: 20,
            display: "grid",
            placeItems: "center",
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 700,
            fontSize: 25,
            color: "#fff",
            background: "linear-gradient(160deg,#FF9A4D,#EE4B8B 55%,#9B5CF0)",
            boxShadow: "0 16px 30px -12px rgba(238,75,139,.6)",
          }}
        >
          K
        </div>
        <h1 className="display" style={{ marginTop: 16, fontSize: 28 }}>
          ยินดีต้อนรับสู่ KepUp
        </h1>
        <p className="lede" style={{ marginTop: 8 }}>
          เก็บทุกโอกาสที่เจอ ไม่ให้พลาดวันปิดรับ
        </p>
      </div>

      <Glass strong style={{ padding: 20 }}>
        <form onSubmit={submit}>
          <label className="label" htmlFor="login-name">
            เรียกคุณว่าอะไรดี
          </label>
          <input
            id="login-name"
            className="field"
            value={name}
            autoFocus
            // not "given-name": browser autofill silently overwrites a typed
            // nickname with a saved profile name, which is jarring on a shared
            // or demo machine
            autoComplete="off"
            placeholder="ชื่อเล่นก็ได้"
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
          />

          <div style={{ marginTop: 18 }}>
            <div className="flex items-center justify-between">
              <span className="label" id="login-grade-label">
                ตอนนี้เรียนอยู่ชั้นไหน
              </span>
              <span className="muted">ไม่ใส่ก็ได้</span>
            </div>
            <div
              className="cat-grid"
              role="group"
              aria-labelledby="login-grade-label"
            >
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  className="grade-opt"
                  data-active={grade === g}
                  aria-pressed={grade === g}
                  onClick={() => setGrade(grade === g ? null : g)}
                >
                  {GRADE_LABELS[g]}
                </button>
              ))}
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              ใช้กรองกิจกรรมที่คุณสมัครได้จริง
            </p>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", marginTop: 22, opacity: canSubmit ? 1 : 0.55 }}
            disabled={!canSubmit}
          >
            เริ่มใช้งาน
            <IconArrow />
          </button>
        </form>
      </Glass>

      <div style={{ textAlign: "center" }}>
        <p className="muted" style={{ lineHeight: 1.7 }}>
          <IconCheck size={13} /> ชั้นวางของคุณเก็บในเครื่องนี้เท่านั้น
          <br />
          ข้อความ/รูปที่ให้ AI อ่านจะถูกส่งไปประมวลผลเพื่อแยกข้อมูล
          <br />
          เราไม่เก็บสำเนาไว้ที่เซิร์ฟเวอร์ · ไม่ต้องใช้รหัสผ่าน
        </p>
      </div>
    </div>
  );
}
