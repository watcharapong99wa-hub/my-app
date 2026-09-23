import { useState, useEffect } from 'react';
import type { AuthSession } from '../types';

const STORAGE_KEY = 'kepup_auth_session';
const COOKIE_KEY = 'kepup_session';

function writeSessionCookie(name: string | null) {
  try {
    if (typeof document === "undefined") return;
    if (name && name.trim()) {
      document.cookie = `${COOKIE_KEY}=${encodeURIComponent(name.trim())}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
    }
  } catch {
    // cookies unavailable - server redirect just won't trigger
  }
}

type AuthListener = () => void;

class AuthStore {
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

  getUser(): AuthSession | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    return Boolean(this.session && this.session.name.trim().length > 0);
  }

  signIn(name: string, grade: string | null) {
    this.session = { name: name.trim(), grade };
    this.save();
    writeSessionCookie(name);
  }

  signOut() {
    this.session = null;
    this.save();
    writeSessionCookie(null);
  }
}

export const auth = new AuthStore();

/** Older logins predate the cookie: re-write it so the server can redirect. */
export function ensureSessionCookie(): void {
  const s = auth.getUser();
  if (s && s.name.trim()) writeSessionCookie(s.name);
}

export function useSession(): AuthSession | null {
  const [session, setSession] = useState<AuthSession | null>(() => auth.getUser());

  useEffect(() => {
    return auth.subscribe(() => {
      setSession(auth.getUser());
    });
  }, []);

  return session;
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'สวัสดีตอนเช้า';
  if (hour >= 12 && hour < 17) return 'สวัสดีตอนบ่าย';
  if (hour >= 17 && hour < 21) return 'สวัสดีตอนเย็น';
  return 'ราตรีสวัสดิ์';
}

export function initialOf(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '?';
  return trimmed[0].toUpperCase();
}
