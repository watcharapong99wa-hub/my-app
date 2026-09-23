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
        this.items = JSON.parse(raw);
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
