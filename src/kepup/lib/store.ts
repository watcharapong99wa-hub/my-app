import { useState, useEffect } from 'react';
import type { Opportunity } from '../types';

const STORAGE_KEY = 'kepup_shelf_items_v3';

// New users start with an empty shelf - no sample data.
const INITIAL_OPPORTUNITIES: Opportunity[] = [];

class ShelfStore {
  private items: Opportunity[] = [];
  private listeners = new Set<() => void>();

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (typeof window === "undefined") {
        this.items = [];
        return;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.items = Array.isArray(parsed)
          ? parsed.map(ShelfStore.normalize)
          : [];
        // persist normalized shape (drops nothing, only fills new fields)
        this.save();
        return;
      }
    } catch (e) {
      console.error('Failed to load shelf from storage', e);
    }
    this.items = INITIAL_OPPORTUNITIES;
    this.save();
  }

  private save() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      }
    } catch (e) {
      console.error('Failed to save shelf to storage', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  getAll(): Opportunity[] {
    return this.items;
  }

  /** Fill fields added after an item was saved (older app versions). */
  private static normalize(raw: Opportunity): Opportunity {
    const o = { ...(raw as Partial<Opportunity>) } as Opportunity;
    if (o.deadlineTime === undefined) o.deadlineTime = null;
    if (!o.deadlineState) o.deadlineState = o.deadlineAt ? "inferred" : "missing";
    if (!o.applyUrlState) o.applyUrlState = o.applyUrl ? "inferred" : "missing";
    if (o.needsReview === undefined) {
      o.needsReview = o.deadlineState !== "found" || o.applyUrlState !== "found";
    }
    if (!o.locationType) o.locationType = "unknown";
    if (o.originalText === undefined) o.originalText = null;
    if (o.originalUrl === undefined) o.originalUrl = null;
    if (o.hasOriginalImage === undefined) o.hasOriginalImage = false;
    if (!Array.isArray(o.requiredDocs)) o.requiredDocs = [];
    return o;
  }

  get(id: string): Opportunity | undefined {
    return this.items.find((item) => item.id === id);
  }

  add(item: Opportunity) {
    this.items = [item, ...this.items.filter((i) => i.id !== item.id)];
    this.save();
  }

  update(id: string, partial: Partial<Opportunity>) {
    this.items = this.items.map((i) => (i.id === id ? { ...i, ...partial } : i));
    this.save();
  }

  remove(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    this.save();
  }

  findDuplicate(title: string, deadlineAt: string | null): Opportunity | undefined {
    const clean = title.trim().toLowerCase();
    return this.items.find((i) => {
      const matchTitle = i.title.trim().toLowerCase() === clean;
      const matchDeadline =
        (i.deadlineAt && deadlineAt && i.deadlineAt.slice(0, 10) === deadlineAt.slice(0, 10)) ||
        (!i.deadlineAt && !deadlineAt);
      return matchTitle && matchDeadline;
    });
  }

  reset() {
    this.items = INITIAL_OPPORTUNITIES;
    this.save();
  }

  /** Download a backup JSON of the whole shelf (device-local data). */
  exportBackup(): void {
    if (typeof window === "undefined") return;
    const payload = JSON.stringify(
      { app: "kepup", version: 1, exportedAt: new Date().toISOString(), items: this.items },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kepup-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Restore shelf from a backup file. Returns item count or throws. */
  async importBackup(file: File): Promise<number> {
    const text = await file.text();
    const parsed = JSON.parse(text) as { items?: unknown };
    if (!parsed || !Array.isArray(parsed.items)) {
      throw new Error("ไฟล์สำรองไม่ถูกต้อง (ต้องเป็นไฟล์ kepup-backup .json)");
    }
    const items = (parsed.items as Opportunity[]).map(ShelfStore.normalize);
    this.items = items;
    this.save();
    return items.length;
  }
}

export const shelf = new ShelfStore();

export function useShelf(): Opportunity[] {
  const [items, setItems] = useState<Opportunity[]>(() => shelf.getAll());

  useEffect(() => {
    return shelf.subscribe(() => {
      setItems([...shelf.getAll()]);
    });
  }, []);

  return items;
}
