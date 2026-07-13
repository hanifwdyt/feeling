// ─────────────────────────────────────────────────────────────────────────────
// Storage.
//
// There is no server, and that is a feature, not a shortcut. An emotion journal
// is the most private thing a person is likely to write down. Data that never
// leaves the device cannot be breached, subpoenaed, sold, or read by me. So the
// whole app is local-first by construction.
//
// The cost is honest and stated in the UI: no cross-device sync. Export/import
// covers moving and backing up.
// ─────────────────────────────────────────────────────────────────────────────

import type { QuadrantId } from "./emotions";

const KEY = "feeling:entries:v1";

export interface Entry {
  id: string;
  /** epoch ms */
  at: number;
  /** grid position, both -1..1 */
  x: number;
  y: number;
  quadrant: QuadrantId;
  /** the emotion word chosen */
  word: string;
  /** 1..10 */
  intensity: number;
  /** context tag ids — the "kenapa" */
  contexts: string[];
  /** optional free text */
  note: string;
}

const uid = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // newest first
    return parsed.sort((a: Entry, b: Entry) => b.at - a.at);
  } catch {
    return [];
  }
}

function persist(entries: Entry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* quota / private mode — the session still works, it just won't survive */
  }
}

export function addEntry(e: Omit<Entry, "id" | "at">): Entry[] {
  const entry: Entry = { ...e, id: uid(), at: Date.now() };
  const next = [entry, ...loadEntries()];
  persist(next);
  return next;
}

export function deleteEntry(id: string): Entry[] {
  const next = loadEntries().filter((e) => e.id !== id);
  persist(next);
  return next;
}

// ── export / import — the only way data moves between devices ────────────────

export function exportJSON(): void {
  const payload = {
    app: "feeling.hanif.app",
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: loadEntries(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `feeling-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Import MERGES rather than replaces, and dedupes by id — importing the same
 * backup twice must not double your history. Restoring a backup should never be
 * a destructive act you have to think hard about.
 */
export function importJSON(file: File): Promise<{ added: number; total: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const incoming: Entry[] = Array.isArray(data) ? data : (data?.entries ?? []);
        if (!Array.isArray(incoming)) throw new Error("format tidak dikenal");

        const existing = loadEntries();
        const seen = new Set(existing.map((e) => e.id));
        const fresh = incoming.filter(
          (e) => e && typeof e.id === "string" && !seen.has(e.id) && typeof e.at === "number"
        );

        const merged = [...existing, ...fresh].sort((a, b) => b.at - a.at);
        persist(merged);
        resolve({ added: fresh.length, total: merged.length });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("gagal membaca file"));
      }
    };
    reader.onerror = () => reject(new Error("gagal membaca file"));
    reader.readAsText(file);
  });
}

export function clearAll(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
