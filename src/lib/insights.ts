// ─────────────────────────────────────────────────────────────────────────────
// INSIGHTS — the part that actually grows emotional intelligence.
//
// Logging alone does nothing. Most mood trackers die here: they collect a year
// of taps and hand back a pretty chart that tells you what you already knew.
// The growth happens when the data says something you DIDN'T know —
// "kamu selalu drop tiap Minggu malam", "kalau tidur kurang, cemasmu naik dua
// kali lipat". That requires context tags, and it requires honesty about when
// there simply isn't enough data yet to say anything.
//
// Which is the rule this file lives by: WE DO NOT MANUFACTURE PATTERNS.
// Every finding below carries a minimum sample size, and when it isn't met we
// say "belum cukup data" rather than dressing up noise as a discovery. A journal
// that invents insights about your inner life is worse than one that stays quiet.
// ─────────────────────────────────────────────────────────────────────────────

import { CONTEXT_BY_ID, QUADRANTS, type QuadrantId } from "./emotions";
import type { Entry } from "./store";

/** Below this, any "pattern" is just noise wearing a suit. */
const MIN_SAMPLES = 4;
const MIN_FOR_CONTEXT = 3;

export interface Insight {
  /** Drives the icon/tone in the UI. */
  kind: "pattern" | "granularity" | "streakless" | "context" | "time";
  title: string;
  detail: string;
}

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const pct = (n: number, d: number): number => (d === 0 ? 0 : Math.round((n / d) * 100));

/** Is this quadrant one of the unpleasant ones? (valence < 0) */
const isUnpleasant = (q: QuadrantId): boolean => q === "red" || q === "blue";

// ── summary numbers ──────────────────────────────────────────────────────────

export interface Summary {
  total: number;
  byQuadrant: Record<QuadrantId, number>;
  /** distinct emotion words used — the granularity measure */
  distinctWords: number;
  avgIntensity: number;
}

export function summarize(entries: Entry[]): Summary {
  const byQuadrant: Record<QuadrantId, number> = { red: 0, yellow: 0, blue: 0, green: 0 };
  const words = new Set<string>();
  let intensitySum = 0;

  for (const e of entries) {
    byQuadrant[e.quadrant]++;
    words.add(e.word);
    intensitySum += e.intensity;
  }

  return {
    total: entries.length,
    byQuadrant,
    distinctWords: words.size,
    avgIntensity: entries.length ? intensitySum / entries.length : 0,
  };
}

// ── the findings ─────────────────────────────────────────────────────────────

export function buildInsights(entries: Entry[]): Insight[] {
  const out: Insight[] = [];

  if (entries.length < MIN_SAMPLES) {
    out.push({
      kind: "streakless",
      title: "Belum cukup data",
      detail:
        `Baru ${entries.length} catatan. Pola baru mulai kelihatan setelah beberapa hari. ` +
        `Nggak usah dikejar — isi pas kamu memang merasakan sesuatu.`,
    });
    return out;
  }

  // ── 1. GRANULARITY — the single measure most tied to real EI growth ────────
  const s = summarize(entries);
  const ratio = s.distinctWords / s.total;
  if (s.distinctWords <= 3 && s.total >= 6) {
    out.push({
      kind: "granularity",
      title: `Kamu cuma pakai ${s.distinctWords} kata berbeda`,
      detail:
        "Coba lihat kata-kata lain di kuadran yang sama sebelum memilih. Bisa bedain " +
        "'kesal' dari 'kecewa' itu bukan main kata — orang yang bisa menamai lebih presisi " +
        "terbukti lebih tenang menghadapinya.",
    });
  } else if (ratio >= 0.5 && s.total >= 8) {
    out.push({
      kind: "granularity",
      title: `${s.distinctWords} kata berbeda dari ${s.total} catatan`,
      detail:
        "Kosakata rasamu luas — dan ini yang paling berkorelasi dengan kemampuan " +
        "mengatur emosi. Kamu tidak sedang menumpuk semuanya jadi 'lagi nggak enak'.",
    });
  }

  // ── 2. CONTEXT × QUADRANT — the finding you can actually act on ────────────
  // For each tag: how often does it show up alongside an unpleasant state,
  // compared to the baseline? Only reported when the tag has enough samples.
  const baselineUnpleasant = pct(entries.filter((e) => isUnpleasant(e.quadrant)).length, entries.length);

  const byContext = new Map<string, { n: number; unpleasant: number }>();
  for (const e of entries) {
    for (const c of e.contexts) {
      const cur = byContext.get(c) ?? { n: 0, unpleasant: 0 };
      cur.n++;
      if (isUnpleasant(e.quadrant)) cur.unpleasant++;
      byContext.set(c, cur);
    }
  }

  const contextFindings = [...byContext.entries()]
    .filter(([, v]) => v.n >= MIN_FOR_CONTEXT)
    .map(([id, v]) => ({
      id,
      n: v.n,
      rate: pct(v.unpleasant, v.n),
      lift: pct(v.unpleasant, v.n) - baselineUnpleasant,
    }))
    .sort((a, b) => Math.abs(b.lift) - Math.abs(a.lift));

  const worst = contextFindings.find((c) => c.lift >= 20);
  if (worst) {
    const tag = CONTEXT_BY_ID[worst.id];
    out.push({
      kind: "context",
      title: `${tag?.emoji ?? ""} ${tag?.label ?? worst.id} sering muncul pas kamu nggak enak`,
      detail:
        `Dari ${worst.n} catatan yang kamu tandai "${tag?.label ?? worst.id}", ${worst.rate}% ada di ` +
        `zona tegang atau redup — sementara rata-ratamu ${baselineUnpleasant}%. ` +
        `Ini bukan sebab-akibat, tapi layak kamu perhatikan.`,
    });
  }

  const best = contextFindings.find((c) => c.lift <= -20);
  if (best) {
    const tag = CONTEXT_BY_ID[best.id];
    out.push({
      kind: "context",
      title: `${tag?.emoji ?? ""} ${tag?.label ?? best.id} kelihatan menolongmu`,
      detail:
        `Cuma ${best.rate}% catatan bertanda ini yang ada di zona nggak enak, ` +
        `jauh di bawah rata-ratamu (${baselineUnpleasant}%). Mungkin ini yang perlu kamu perbanyak.`,
    });
  }

  // ── 3. DAY OF WEEK ────────────────────────────────────────────────────────
  const byDay = new Map<number, { n: number; unpleasant: number }>();
  for (const e of entries) {
    const d = new Date(e.at).getDay();
    const cur = byDay.get(d) ?? { n: 0, unpleasant: 0 };
    cur.n++;
    if (isUnpleasant(e.quadrant)) cur.unpleasant++;
    byDay.set(d, cur);
  }
  const dayFindings = [...byDay.entries()]
    .filter(([, v]) => v.n >= MIN_FOR_CONTEXT)
    .map(([d, v]) => ({ d, n: v.n, rate: pct(v.unpleasant, v.n) }))
    .sort((a, b) => b.rate - a.rate);

  const hardDay = dayFindings[0];
  if (hardDay && hardDay.rate - baselineUnpleasant >= 25) {
    out.push({
      kind: "time",
      title: `Hari ${DAYS[hardDay.d]} paling berat buatmu`,
      detail:
        `${hardDay.rate}% catatan hari ${DAYS[hardDay.d]} ada di zona nggak enak ` +
        `(rata-ratamu ${baselineUnpleasant}%). Kalau ini berulang, mungkin ada yang bisa ` +
        `kamu geser di hari itu.`,
    });
  }

  // ── 4. DOMINANT ZONE ──────────────────────────────────────────────────────
  const dominant = (Object.keys(s.byQuadrant) as QuadrantId[]).sort(
    (a, b) => s.byQuadrant[b] - s.byQuadrant[a]
  )[0];
  const share = pct(s.byQuadrant[dominant], s.total);
  if (share >= 50) {
    const q = QUADRANTS[dominant];
    out.push({
      kind: "pattern",
      title: `${share}% waktumu ada di zona "${q.label}"`,
      detail: `${q.hint}. ${
        isUnpleasant(dominant)
          ? "Kalau ini terus-terusan dan terasa berat, tidak apa-apa mencari bantuan — data ini bisa jadi bahan cerita."
          : "Bagus. Perhatikan apa yang bikin kamu tetap di sana."
      }`,
    });
  }

  // ── 5. Deliberately absent: streaks. ───────────────────────────────────────
  // Streaks turn an honest journal into a performance. Once you're protecting a
  // number, you start logging "fine" on the days you're not, and the data — the
  // only thing here with any value — quietly becomes a lie. So there are none.
  if (out.length === 0) {
    out.push({
      kind: "pattern",
      title: "Belum ada pola yang jelas",
      detail:
        "Catatanmu masih tersebar dan belum ada kecenderungan yang cukup kuat untuk disebut pola. " +
        "Itu wajar — dan lebih baik daripada aku mengarang sesuatu yang tidak ada.",
    });
  }

  return out;
}

// ── chart data ───────────────────────────────────────────────────────────────

export interface DayPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "13/7"
  /** mean valence -1..1 for that day, or null if nothing logged */
  valence: number | null;
  count: number;
}

/** Last `days` days of mean valence, for the trend line. */
export function dailyTrend(entries: Entry[], days = 14): DayPoint[] {
  const out: DayPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    const end = start + 86_400_000;

    const inDay = entries.filter((e) => e.at >= start && e.at < end);
    out.push({
      date: d.toISOString().slice(0, 10),
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      valence: inDay.length ? inDay.reduce((a, e) => a + e.x, 0) / inDay.length : null,
      count: inDay.length,
    });
  }
  return out;
}

/** Most-used words, for the "kosakata" view. */
export function topWords(entries: Entry[], n = 8): { word: string; count: number; quadrant: QuadrantId }[] {
  const m = new Map<string, { count: number; quadrant: QuadrantId }>();
  for (const e of entries) {
    const cur = m.get(e.word) ?? { count: 0, quadrant: e.quadrant };
    cur.count++;
    m.set(e.word, cur);
  }
  return [...m.entries()]
    .map(([word, v]) => ({ word, count: v.count, quadrant: v.quadrant }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}
