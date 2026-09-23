import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { AuthSession } from "../types";

const STORAGE_KEY = "kepup_auth_session";

type AuthListener = () => void;

/** Legacy nickname session (offline fallback), kept in localStorage. */
class NicknameStore {
  private session: AuthSession | null = null;
  private listeners = new Set<AuthListener>();

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (typeof window === "undefined") {
        this.session = null;
        return;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.session = JSON.parse(raw);
        return;
      }
    } catch {
      this.session = null;
    }
    this.session = null;
  }

  private save() {
    try {
      if (typeof window === "undefined") {
        this.notify();
        return;
      }
      if (this.session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // storage quota or unavailable
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  subscribe(fn: AuthListener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  get(): AuthSession | null {
    return this.session;
  }

  signIn(name: string, grade: string | null) {
    this.session = { name: name.trim(), grade };
    this.save();
  }

  signOut() {
    this.session = null;
    this.save();
  }
}

export const nicknameStore = new NicknameStore();

let browserClient: ReturnType<typeof createClient> | null = null;
function supabase() {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}

export interface AppSession {
  name: string;
  grade: string | null;
  email: string | null;
  viaGoogle: boolean;
}

function fromSupabaseUser(user: User): AppSession {
  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const fullName =
    (meta.full_name as string) ||
    (meta.name as string) ||
    user.email ||
    "นักเรียน";
  return { name: fullName, grade: null, email: user.email ?? null, viaGoogle: true };
}

/** Unified session: Google (Supabase) first, nickname fallback second. */
export function useAppSession(): { session: AppSession | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [nick, setNick] = useState<AuthSession | null>(() => nicknameStore.get());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, sess) => {
      setUser(sess?.user ?? null);
    });
    const unsubNick = nicknameStore.subscribe(() => {
      setNick(nicknameStore.get());
    });
    return () => {
      sub.subscription.unsubscribe();
      unsubNick();
    };
  }, []);

  if (loading) return { session: null, loading: true };
  if (user) return { session: fromSupabaseUser(user), loading: false };
  if (nick && nick.name.trim()) return { session: { ...nick, email: null, viaGoogle: false }, loading: false };
  return { session: null, loading: false };
}

export async function signInWithGoogle(): Promise<string | null> {
  const sb = supabase();
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=/app`,
    },
  });
  if (error) return translateOAuthError(error.message);
  return null;
}

function translateOAuthError(message: string): string {
  if (/provider is not enabled|unsupported provider/i.test(message)) {
    return "ยังไม่เปิด Google Login ใน Supabase (Authentication > Providers > Google) — หรือใช้ชื่อเล่นด้านล่างก่อนได้";
  }
  return `เข้าสู่ระบบไม่สำเร็จ: ${message}`;
}

export async function signOutEverywhere(): Promise<void> {
  try {
    await supabase().auth.signOut();
  } catch {
    // ignore - still clear local nickname below
  }
  nicknameStore.signOut();
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "สวัสดีตอนเช้า";
  if (hour >= 12 && hour < 17) return "สวัสดีตอนบ่าย";
  if (hour >= 17 && hour < 21) return "สวัสดีตอนเย็น";
  return "ราตรีสวัสดิ์";
}

export function initialOf(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  return trimmed[0].toUpperCase();
}
