"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Glass } from "../components/primitives";
import { IconArrow, IconCheck } from "../components/Icons";
import { nicknameStore, signInWithGoogle } from "../lib/auth";
import { GRADE_LABELS } from "../lib/format";

const GRADES = ["m1", "m2", "m3", "m4", "m5", "m6", "voc"];

export function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthFailed = searchParams.get("error") === "oauth";

  const [name, setName] = useState("");
  const [grade, setGrade] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(
    oauthFailed ? "Google Login ไม่สำเร็จ — ตรวจว่าเปิด Provider ใน Supabase แล้ว" : null
  );

  const canSubmit = name.trim().length > 0;

  async function google() {
    setBusy(true);
    setErr(null);
    try {
      const message = await signInWithGoogle();
      if (message) {
        setErr(message);
        setBusy(false);
      }
      // success redirects to Google - stay busy
    } catch (e) {
      setErr(e instanceof Error ? e.message : "เข้าสู่ระบบไม่สำเร็จ");
      setBusy(false);
    }
  }

  function submitNickname(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    nicknameStore.signIn(name, grade);
    router.replace("/app");
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
        <button
          type="button"
          className="btn-primary"
          style={{ width: "100%", opacity: busy ? 0.7 : 1 }}
          disabled={busy}
          onClick={google}
        >
          <span
            aria-hidden="true"
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: "#fff",
              color: "#DB4437",
              fontWeight: 800,
              fontSize: 13,
              display: "inline-grid",
              placeItems: "center",
              flex: "none",
            }}
          >
            G
          </span>
          {busy ? "กำลังเปิด Google..." : "เข้าด้วย Google"}
          <IconArrow />
        </button>

        {err && (
          <p style={{ marginTop: 12, fontSize: 13, color: "#A6322A", lineHeight: 1.6 }}>
            {err}
          </p>
        )}

        <div
          className="flex items-center gap-2"
          style={{ margin: "20px 0 4px", color: "var(--ink-3)", fontSize: 12 }}
          aria-hidden="true"
        >
          <span style={{ flex: 1, height: 1, background: "rgba(92,72,130,.18)" }} />
          หรือใช้ชื่อเล่น
          <span style={{ flex: 1, height: 1, background: "rgba(92,72,130,.18)" }} />
        </div>

        <form onSubmit={submitNickname}>
          <label className="label" htmlFor="login-name">
            เรียกคุณว่าอะไรดี
          </label>
          <input
            id="login-name"
            className="field"
            value={name}
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
          <IconCheck size={13} /> ชื่อเล่นเก็บอยู่ในเครื่องนี้เท่านั้น
          <br />
          Google Login ซิงก์บัญชีของคุณ ไม่ต้องใช้รหัสผ่าน
        </p>
      </div>
    </div>
  );
}
