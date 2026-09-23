"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setReviewState } from "../lib/reviewState";
import { Glass } from "../components/primitives";
import { IconArrow, IconImage, IconSparkle, IconText } from "../components/Icons";
import { blankDraft, extract, fileToInlineImage } from "../lib/extract";
import { useVision } from "../lib/vision";

type Mode = "text" | "image";

export function Capture() {
  const router = useRouter();
  const vision = useVision();
  const visionOn = vision?.vision === true;

  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // clean preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onFile(f: File | null) {
    if (!f) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setErr(null);
  }

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      let images: { mimeType: string; data: string }[] | undefined;
      if (mode === "image" && imageFile) {
        const inline = await fileToInlineImage(imageFile);
        images = [inline];
      }
      const res = await extract({
        text: mode === "text" ? text : undefined,
        images,
      });

      // Pass result into the review screen.
      setReviewState({
        draft: res.draft,
        meta: {
          latencyMs: res.latencyMs,
          deadlineDisputed: res.deadlineDisputed,
          usedFallback: res.usedFallback,
          found: res.found,
        },
      });
      router.push("/review");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ดึงข้อมูลไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  const canRun =
    !loading &&
    ((mode === "text" && text.trim().length > 0) ||
      (mode === "image" && imageFile !== null));

  return (
    <div
      className="app"
      style={{
        paddingBlock: "20px 32px",
        minHeight: "100dvh",
        justifyContent: "space-between",
        gap: 20,
      }}
    >
      <div style={{ display: "grid", gap: 16 }}>
        {/* top bar */}
        <div className="flex items-center justify-between">
          <button className="btn-ghost" onClick={() => router.back()}>
            ← กลับ
          </button>
          <span className="label">บันทึกโอกาส</span>
        </div>

        <div>
          <h1 className="h1">วางสิ่งที่เจอ</h1>
          <p className="lede" style={{ marginTop: 4 }}>
            แคปหน้าจอ โพสต์เฟซ ไอจี หรือข้อความที่เพื่อนส่งมา
          </p>
        </div>

        {/* mode switch */}
        <div className="seg" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "text"}
            data-active={mode === "text"}
            onClick={() => setMode("text")}
          >
            <IconText size={15} /> ข้อความ / ลิงก์
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "image"}
            data-active={mode === "image"}
            onClick={() => setMode("image")}
          >
            <IconImage size={15} /> รูป / โปสเตอร์
          </button>
        </div>

        {mode === "text" && (
          <Glass strong style={{ padding: 14 }}>
            <textarea
              id="capture-text"
              className="field"
              rows={8}
              value={text}
              placeholder="วางข้อความ รายละเอียด หรือลิงก์กิจกรรมที่นี่..."
              onChange={(e) => setText(e.target.value)}
            />
            <div
              className="flex items-center justify-between"
              style={{ marginTop: 10 }}
            >
              <span />
              {text && (
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => setText("")}
                >
                  ล้าง
                </button>
              )}
            </div>
          </Glass>
        )}

        {mode === "image" && (
          <Glass strong style={{ padding: 14 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />

            {!previewUrl ? (
              <div
                className="tap"
                style={{
                  border: "2px dashed rgba(92,72,130,.25)",
                  borderRadius: 18,
                  padding: "36px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    margin: "0 auto",
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(238,75,139,.1)",
                    color: "#EE4B8B",
                  }}
                >
                  <IconImage size={24} />
                </div>
                <p style={{ marginTop: 12, fontWeight: 600 }}>
                  แตะเพื่อเลือกรูปหรือโปสเตอร์
                </p>
                <p className="muted" style={{ marginTop: 4 }}>
                  PNG, JPG หรือรูปที่แคปจากมือถือ
                </p>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <img
                  src={previewUrl}
                  alt="ตัวอย่างรูปที่เลือก"
                  style={{
                    width: "100%",
                    maxHeight: 300,
                    objectFit: "contain",
                    borderRadius: 12,
                    background: "rgba(0,0,0,.04)",
                  }}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "rgba(255,255,255,.9)",
                    backdropFilter: "blur(6px)",
                  }}
                  onClick={() => {
                    setImageFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  เปลี่ยนรูป
                </button>
              </div>
            )}

            {!visionOn && (
              <p
                className="muted"
                style={{
                  marginTop: 10,
                  fontSize: 11.5,
                  textAlign: "center",
                  color: "#9C7030",
                }}
              >
                รูปภาพจะถูกส่งให้อ่านผ่านระบบ AI วิเคราะห์ตัวหนังสือ
              </p>
            )}
          </Glass>
        )}

        {err && (
          <Glass
            strong
            style={{
              padding: "10px 14px",
              borderLeft: "3px solid #E4325F",
              color: "#A6322A",
              fontSize: 13,
            }}
          >
            {err}
          </Glass>
        )}
      </div>

      {/* action bottom */}
      <div style={{ display: "grid", gap: 10 }}>
        <button
          className="btn-primary"
          style={{ width: "100%", opacity: canRun ? 1 : 0.55 }}
          disabled={!canRun}
          onClick={run}
        >
          {loading ? (
            <>
              <IconSparkle size={16} /> กำลังแยกข้อมูล...
            </>
          ) : (
            <>
              ให้ KepUp แยกข้อมูล <IconArrow />
            </>
          )}
        </button>

        <button
          className="btn-ghost"
          style={{ justifyContent: "center" }}
          onClick={() => {
            setReviewState({ draft: blankDraft(), manual: true });
            router.push("/review");
          }}
        >
          หรือกรอกเองทั้งหมด
        </button>
      </div>
    </div>
  );
}
