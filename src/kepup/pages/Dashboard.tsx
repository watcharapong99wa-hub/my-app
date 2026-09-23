"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Opportunity } from "../types";
import { CATEGORIES, gradientOf } from "../lib/categories";
import {
  TH_MONTHS_FULL,
  TH_WEEKDAYS_SHORT,
  daysUntilDeadline,
  toBE,
} from "../lib/format";
import { auth, greeting, initialOf } from "../lib/auth";
import { useShelf } from "../lib/store";
import { BottomNav, type Tab } from "../components/BottomNav";
import { FeaturedCard, OpportunityCard } from "../components/OpportunityCard";
import { Bubble, Glass, Segmented } from "../components/primitives";
import { CalendarView } from "../components/CalendarView";
import { ProfileView } from "../components/ProfileView";
import { IconSparkle } from "../components/Icons";

const VIEWS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "upcoming", label: "ใกล้ปิดรับ" },
  { value: "nodate", label: "ไม่มีวัน" },
  { value: "closed", label: "ปิดแล้ว" },
];

export function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const rawTab = params.get("tab");
  const tab: Tab =
    rawTab === "due" || rawTab === "calendar" || rawTab === "profile"
      ? rawTab
      : "shelf";

  const session = auth.getUser();
  const items = useShelf();

  const [query, setQuery] = useState("");
  const [view, setView] = useState<string>("all");
  const [cat, setCat] = useState<string>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { competition: 0, camp: 0, scholarship: 0, total: items.length };
    for (const o of items) {
      if (o.category in c) c[o.category]++;
    }
    return c;
  }, [items]);

  const dueSoon = useMemo(() => {
    return items
      .filter((o) => o.deadlineAt)
      .map((o) => ({ o, days: daysUntilDeadline(o) }))
      .filter(({ days }) => days >= 0)
      .sort((a, b) => a.days - b.days);
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((o) => {
      if (
        q &&
        !(
          o.title.toLowerCase().includes(q) ||
          (o.organizer || "").toLowerCase().includes(q)
        )
      )
        return false;
      if (cat !== "all" && o.category !== cat) return false;
      const hasDate = Boolean(o.deadlineAt);
      const d = hasDate ? daysUntilDeadline(o) : 9999;
      if (view === "upcoming" && !(hasDate && d >= 0)) return false;
      if (view === "nodate" && hasDate) return false;
      if (view === "closed" && !(hasDate && d < 0)) return false;
      return true;
    });
    if (view === "upcoming") {
      return [...list].sort((a, b) => daysUntilDeadline(a) - daysUntilDeadline(b));
    }
    return list;
  }, [items, query, view, cat]);

  const featured = dueSoon[0]?.o ?? items[0];

  function open(o: Opportunity) {
    router.push(`/card/${o.id}`);
  }

  function selectTab(t: Tab) {
    if (t === "shelf") {
      router.replace(pathname, { scroll: false });
    } else {
      router.replace(`${pathname}?tab=${t}`, { scroll: false });
    }
  }

  return (
    <div className="app" style={{ paddingBlock: "22px 96px", minHeight: "100dvh", gap: 18 }}>
      {/* greeting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              background: "linear-gradient(160deg,#FF9A4D,#EE4B8B 55%,#9B5CF0)",
              boxShadow: "0 8px 16px -6px rgba(238,75,139,.6)",
            }}
          >
            {session ? initialOf(session.name) : "K"}
          </div>
          <div>
            <span className="muted" style={{ fontSize: 12 }}>
              {greeting()}
            </span>
            <h1
              style={{
                fontSize: 19,
                fontWeight: 700,
                color: "var(--ink)",
                lineHeight: 1.2,
              }}
            >
              {session?.name ? session.name : "นักล่าโอกาส"}
            </h1>
          </div>
        </div>

        <button
          className="btn-ghost tap"
          aria-label="บันทึกโอกาสใหม่"
          onClick={() => router.push("/capture")}
        >
          <IconSparkle size={14} /> บันทึกใหม่
        </button>
      </div>

      {tab === "shelf" && (
        <>
          {/* floating bubbles - responsive row, never overlaps neighbours */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-around",
              gap: 6,
              paddingInline: 2,
            }}
          >
            <Bubble
              size={100}
              gradient={gradientOf("competition")}
              label={CATEGORIES.competition.label}
              value={counts.competition}
              className="float"
            />
            <Bubble
              size={122}
              gradient={gradientOf("camp")}
              label={CATEGORIES.camp.label}
              value={counts.camp}
              className="float-2"
              style={{ marginBottom: 12 }}
            />
            <Bubble
              size={96}
              gradient={gradientOf("scholarship")}
              label={CATEGORIES.scholarship.label}
              value={counts.scholarship}
              className="float-3"
            />
          </div>

          {/* urgent banner if anything is <= 3 days */}
          {dueSoon.length > 0 && dueSoon[0].days <= 3 && (
            <Glass
              strong
              style={{
                padding: "12px 16px",
                borderLeft: "3px solid #E4325F",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
                  มีรายการจะปิดรับในอีก {dueSoon[0].days === 0 ? "วันนี้" : `${dueSoon[0].days} วัน`}
                </p>
                <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {dueSoon[0].o.title}
                </p>
              </div>
              <button
                className="btn-ghost"
                style={{ fontSize: 12, padding: "6px 10px" }}
                onClick={() => open(dueSoon[0].o)}
              >
                ดู
              </button>
            </Glass>
          )}

          {/* featured */}
          {featured && (
            <div>
              <div className="flex items-baseline justify-between" style={{ marginBottom: 10 }}>
                <h2 className="h2">เด่นช่วงนี้</h2>
                <span className="muted">คัดจากวันปิดรับ</span>
              </div>
              <FeaturedCard o={featured} onOpen={open} />
            </div>
          )}

          {/* list with search + views */}
          <div style={{ display: "grid", gap: 12 }}>
            <div className="flex items-center justify-between" style={{ gap: 8 }}>
              <h2 className="h2">ชั้นวางของฉัน</h2>
              <Segmented value={view} options={VIEWS} onChange={setView} />
            </div>
            <input
              className="field"
              value={query}
              placeholder="ค้นหาชื่อหรือผู้จัด..."
              onChange={(e) => setQuery(e.target.value)}
              aria-label="ค้นหาในชั้นวาง"
            />
            <div className="scroll-x flex" style={{ gap: 6, paddingBottom: 2 }}>
              <button
                type="button"
                className="chip tap"
                data-active={cat === "all"}
                onClick={() => setCat("all")}
              >
                ทุกหมวด
              </button>
              {(Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className="chip tap"
                  data-active={cat === k}
                  onClick={() => setCat(cat === k ? "all" : k)}
                >
                  {CATEGORIES[k].label}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <Glass strong style={{ padding: 24, textAlign: "center" }}>
                <p style={{ fontWeight: 600 }}>
                  {items.length === 0 ? "ชั้นวางยังว่างอยู่" : "ไม่เจอรายการที่ตรงกัน"}
                </p>
                <p className="muted" style={{ marginTop: 4 }}>
                  {items.length === 0
                    ? "ลองแคปโปสเตอร์หรือข้อความที่เจอมาให้ KepUp แยกให้ดู"
                    : "ลองเปลี่ยนคำค้นหรือมุมมอง"}
                </p>
                {items.length === 0 && (
                  <button
                    className="btn-primary"
                    style={{ marginTop: 14 }}
                    onClick={() => router.push("/capture")}
                  >
                    <IconSparkle size={15} /> บันทึกแรกของคุณ
                  </button>
                )}
              </Glass>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {visible.map((o) => (
                  <OpportunityCard key={o.id} o={o} onOpen={open} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "due" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <h2 className="h2">เรียงตามวันปิดรับ</h2>
            <p className="muted" style={{ marginTop: 2 }}>
              ไม่พลาดโอกาสที่ใกล้หมดเขต
            </p>
          </div>
          {dueSoon.length === 0 ? (
            <Glass strong style={{ padding: 24, textAlign: "center" }}>
              <p style={{ fontWeight: 600 }}>ยังไม่มีรายการที่มีวันปิดรับ</p>
            </Glass>
          ) : (
            dueSoon.map(({ o }) => (
              <OpportunityCard key={o.id} o={o} onOpen={open} />
            ))
          )}
        </div>
      )}

      {tab === "calendar" && <CalendarView items={items} onOpen={open} />}

      {tab === "profile" && (
        <ProfileView
          session={session ?? { name: "นักเรียน", grade: null }}
          items={items}
          onSignOut={() => {
            auth.signOut();
            router.replace("/login");
          }}
        />
      )}

      <BottomNav active={tab} onChange={selectTab} onCapture={() => router.push("/capture")} />
    </div>
  );
}
