// ─────────────────────────────────────────────────────────────────────────────
// THE LEXICON.
//
// This file is the actual intervention. Everything else is a wrapper around it.
//
// The research (Lisa Feldman Barrett, "emotional granularity") is blunt about
// this: people who can only reach for "bad" regulate worse than people who can
// tell apart kesal / kecewa / dongkol / jengah. Naming precisely is itself the
// regulation — affect labeling measurably quiets the amygdala. So a rich, NATIVE
// vocabulary isn't decoration here; it is the mechanism.
//
// Which is why every word below is chosen as an Indonesian speaker would
// actually feel it — not translated from an English list. "Dongkol" is not
// "annoyed". "Plong" is not "relieved". "Hampa" is not "sad". Those distinctions
// are exactly what we're trying to hand the user.
//
// Layout follows Russell's circumplex / the Yale Mood Meter (Marc Brackett):
// two axes — valence (unpleasant→pleasant) and energy (low→high) — giving four
// quadrants. A 1-10 scale alone would collapse these: anger at 3/10 and sadness
// at 3/10 look identical on one axis, but one needs discharging and the other
// needs rest. The two axes keep them apart.
// ─────────────────────────────────────────────────────────────────────────────

export type QuadrantId = "red" | "yellow" | "blue" | "green";

export interface Quadrant {
  id: QuadrantId;
  /** What the reader sees. */
  label: string;
  /** Plain-language description of the bodily state, not a clinical term. */
  hint: string;
  color: string;
  soft: string;
  ink: string;
}

export const QUADRANTS: Record<QuadrantId, Quadrant> = {
  red: {
    id: "red",
    label: "Tegang",
    hint: "energi tinggi, rasanya nggak enak",
    color: "#d8564a",
    soft: "#fbe9e7",
    ink: "#8e2f26",
  },
  yellow: {
    id: "yellow",
    label: "Hidup",
    hint: "energi tinggi, rasanya enak",
    color: "#e0a32e",
    soft: "#fdf3dd",
    ink: "#8a5f11",
  },
  blue: {
    id: "blue",
    label: "Redup",
    hint: "energi rendah, rasanya nggak enak",
    color: "#4a7fb5",
    soft: "#e8f0f8",
    ink: "#2b5480",
  },
  green: {
    id: "green",
    label: "Tenang",
    hint: "energi rendah, rasanya enak",
    color: "#4f9070",
    soft: "#e7f2ec",
    ink: "#2c5e46",
  },
};

export interface Emotion {
  word: string;
  quadrant: QuadrantId;
  /**
   * A short gloss that draws the line against its NEIGHBOURS — the whole point
   * is helping someone notice that what they feel is `dongkol`, not just
   * `marah`. Without this, a long word list is just a thesaurus.
   */
  nuance: string;
}

/**
 * Ordered roughly from most common to most specific inside each quadrant, so the
 * everyday word is reachable fast but the precise one is right there when the
 * everyday word doesn't quite fit.
 */
export const EMOTIONS: Emotion[] = [
  // ── RED — high energy, unpleasant ──────────────────────────────────────────
  { word: "Kesal", quadrant: "red", nuance: "kejengkelan yang masih bisa ditahan" },
  { word: "Marah", quadrant: "red", nuance: "ada yang dilanggar, dan kamu ingin melawan" },
  { word: "Cemas", quadrant: "red", nuance: "takut pada sesuatu yang belum terjadi" },
  { word: "Panik", quadrant: "red", nuance: "cemas yang sudah menguasai badan" },
  { word: "Frustrasi", quadrant: "red", nuance: "sudah berusaha, tapi mentok terus" },
  { word: "Kewalahan", quadrant: "red", nuance: "terlalu banyak hal sekaligus, tak tahu mulai dari mana" },
  { word: "Gelisah", quadrant: "red", nuance: "tak bisa diam, tapi tak jelas kenapa" },
  { word: "Dongkol", quadrant: "red", nuance: "kesal yang dipendam, tidak diucapkan" },
  { word: "Jengkel", quadrant: "red", nuance: "kesal karena sesuatu yang berulang" },
  { word: "Geram", quadrant: "red", nuance: "marah yang ditahan sampai badan menegang" },
  { word: "Terancam", quadrant: "red", nuance: "merasa ada yang mau diambil darimu" },
  { word: "Iri", quadrant: "red", nuance: "orang lain punya yang kamu inginkan" },
  { word: "Malu", quadrant: "red", nuance: "ingin menghilang dari pandangan orang" },
  { word: "Defensif", quadrant: "red", nuance: "siaga membela diri, padahal belum tentu diserang" },
  { word: "Tersinggung", quadrant: "red", nuance: "harga dirimu terasa disenggol" },
  { word: "Stres", quadrant: "red", nuance: "tuntutan terasa lebih besar dari kemampuanmu" },

  // ── YELLOW — high energy, pleasant ─────────────────────────────────────────
  { word: "Senang", quadrant: "yellow", nuance: "ringan dan cerah, tanpa syarat" },
  { word: "Bersemangat", quadrant: "yellow", nuance: "ingin segera mulai" },
  { word: "Bangga", quadrant: "yellow", nuance: "kamu melihat hasil dari usahamu sendiri" },
  { word: "Antusias", quadrant: "yellow", nuance: "tertarik sampai ingin tahu lebih jauh" },
  { word: "Optimis", quadrant: "yellow", nuance: "yakin arahnya akan baik" },
  { word: "Terinspirasi", quadrant: "yellow", nuance: "melihat sesuatu, lalu ingin membuat sesuatu" },
  { word: "Percaya diri", quadrant: "yellow", nuance: "merasa mampu menghadapinya" },
  { word: "Takjub", quadrant: "yellow", nuance: "sesuatu terasa lebih besar dari dirimu" },
  { word: "Tertantang", quadrant: "yellow", nuance: "sulit, tapi kamu justru ingin coba" },
  { word: "Gembira", quadrant: "yellow", nuance: "senang yang ingin dibagikan" },
  { word: "Penuh harap", quadrant: "yellow", nuance: "menanti sesuatu yang baik" },
  { word: "Fokus", quadrant: "yellow", nuance: "tenggelam, waktu terasa hilang" },
  { word: "Terhubung", quadrant: "yellow", nuance: "merasa dimengerti oleh seseorang" },
  { word: "Lega-gembira", quadrant: "yellow", nuance: "beban lepas, dan kamu ingin merayakannya" },

  // ── GREEN — low energy, pleasant ───────────────────────────────────────────
  { word: "Tenang", quadrant: "green", nuance: "tidak ada yang mendesak" },
  { word: "Lega", quadrant: "green", nuance: "sesuatu yang menekan akhirnya lepas" },
  { word: "Bersyukur", quadrant: "green", nuance: "sadar bahwa yang kamu punya sudah cukup" },
  { word: "Damai", quadrant: "green", nuance: "tidak ada yang perlu dilawan" },
  { word: "Puas", quadrant: "green", nuance: "sesuai yang kamu harapkan" },
  { word: "Nyaman", quadrant: "green", nuance: "badan dan pikiran sama-sama betah" },
  { word: "Aman", quadrant: "green", nuance: "tidak perlu waspada" },
  { word: "Plong", quadrant: "green", nuance: "beban yang lama menempel, hilang mendadak" },
  { word: "Ikhlas", quadrant: "green", nuance: "sudah berhenti menuntut hasil tertentu" },
  { word: "Dihargai", quadrant: "green", nuance: "keberadaanmu terasa berarti bagi orang" },
  { word: "Rileks", quadrant: "green", nuance: "otot dan pikiran sama-sama kendur" },
  { word: "Tenteram", quadrant: "green", nuance: "tenang yang dalam, bukan sekadar tak ada masalah" },
  { word: "Utuh", quadrant: "green", nuance: "tidak sedang mencari apa-apa" },

  // ── BLUE — low energy, unpleasant ──────────────────────────────────────────
  { word: "Sedih", quadrant: "blue", nuance: "ada yang hilang atau tak tercapai" },
  { word: "Lelah", quadrant: "blue", nuance: "tenaga habis, dan istirahat belum cukup" },
  { word: "Kecewa", quadrant: "blue", nuance: "kenyataan tak sesuai yang kamu harapkan" },
  { word: "Hampa", quadrant: "blue", nuance: "bukan sedih — justru tak merasakan apa-apa" },
  { word: "Bosan", quadrant: "blue", nuance: "tak ada yang menarik perhatianmu" },
  { word: "Kesepian", quadrant: "blue", nuance: "ada orang di sekitarmu, tapi tetap terasa sendiri" },
  { word: "Jenuh", quadrant: "blue", nuance: "bukan lelah badan — lelah pada hal yang itu-itu saja" },
  { word: "Bersalah", quadrant: "blue", nuance: "kamu merasa telah merugikan orang lain" },
  { word: "Menyesal", quadrant: "blue", nuance: "andai dulu kamu memilih yang lain" },
  { word: "Tak berdaya", quadrant: "blue", nuance: "tak ada yang bisa kamu lakukan soal ini" },
  { word: "Rindu", quadrant: "blue", nuance: "sesuatu atau seseorang terasa jauh" },
  { word: "Patah hati", quadrant: "blue", nuance: "kehilangan yang menyentuh siapa dirimu" },
  { word: "Putus asa", quadrant: "blue", nuance: "tak lagi melihat jalan keluar" },
  { word: "Mati rasa", quadrant: "blue", nuance: "terlalu banyak, sampai kamu berhenti merasa" },
  { word: "Malas", quadrant: "blue", nuance: "tahu harus apa, tapi tak ada dorongan" },
];

export const EMOTIONS_BY_QUADRANT: Record<QuadrantId, Emotion[]> = {
  red: EMOTIONS.filter((e) => e.quadrant === "red"),
  yellow: EMOTIONS.filter((e) => e.quadrant === "yellow"),
  blue: EMOTIONS.filter((e) => e.quadrant === "blue"),
  green: EMOTIONS.filter((e) => e.quadrant === "green"),
};

export const EMOTION_BY_WORD: Record<string, Emotion> = Object.fromEntries(
  EMOTIONS.map((e) => [e.word, e])
);

/**
 * Map a point on the grid to its quadrant. Both axes run -1..1;
 * x = valence (unpleasant → pleasant), y = energy (low → high).
 */
export function quadrantAt(x: number, y: number): QuadrantId {
  if (y >= 0) return x >= 0 ? "yellow" : "red";
  return x >= 0 ? "green" : "blue";
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT — the "kenapa".
//
// Free text alone is where mood trackers go to die: it's slow to write and
// impossible to compute over. Tags cost one tap and are what later makes
// "kamu selalu drop tiap Minggu malam" possible at all. The note field stays,
// but it is optional — the tags carry the analysis.
// ─────────────────────────────────────────────────────────────────────────────

export interface ContextTag {
  id: string;
  label: string;
  emoji: string;
}

export const CONTEXTS: ContextTag[] = [
  { id: "kerja", label: "Kerjaan", emoji: "💼" },
  { id: "tidur", label: "Tidur", emoji: "😴" },
  { id: "badan", label: "Kondisi badan", emoji: "🫀" },
  { id: "keluarga", label: "Keluarga", emoji: "🏠" },
  { id: "pasangan", label: "Pasangan", emoji: "💞" },
  { id: "teman", label: "Teman", emoji: "🧑‍🤝‍🧑" },
  { id: "duit", label: "Uang", emoji: "💸" },
  { id: "diri", label: "Diri sendiri", emoji: "🪞" },
  { id: "masadepan", label: "Masa depan", emoji: "🔮" },
  { id: "ibadah", label: "Ibadah", emoji: "🕌" },
  { id: "olahraga", label: "Olahraga", emoji: "🏃" },
  { id: "sosmed", label: "Sosmed", emoji: "📱" },
  { id: "jalan", label: "Perjalanan", emoji: "🚗" },
  { id: "belajar", label: "Belajar", emoji: "📚" },
];

export const CONTEXT_BY_ID: Record<string, ContextTag> = Object.fromEntries(
  CONTEXTS.map((c) => [c.id, c])
);
