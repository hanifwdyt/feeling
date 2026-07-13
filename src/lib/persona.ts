// ─────────────────────────────────────────────────────────────────────────────
// The companion's persona — chosen by the user at first run.
//
// Why let people design their own listener: who you can open up to is personal.
// Some people need to be asked questions; some need to be left alone to talk;
// some need a friend who will actually push back. Forcing one voice on everyone
// means most people quietly stop using it.
//
// What the persona canNOT do is override the safety rules — those are appended
// server-side, after the persona text, in server/companion.js. A persona field
// is not a place to hand a struggling person the keys.
// ─────────────────────────────────────────────────────────────────────────────

export type StyleId = "pendengar" | "penanya" | "realis" | "santai" | "custom";

export interface Persona {
  name: string;
  style: StyleId;
  /** free-text personality, used when style === "custom" */
  custom?: string;
}

export interface StyleOption {
  id: StyleId;
  label: string;
  blurb: string;
  sample: string;
}

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "pendengar",
    label: "Pendengar",
    blurb: "Dengerin, ulangi balik apa yang kamu rasa. Jarang kasih saran.",
    sample: "“Jadi capeknya bukan karena kerjaannya ya, tapi karena ngerasa nggak dianggap.”",
  },
  {
    id: "penanya",
    label: "Penanya",
    blurb: "Nanya balik dengan lembut. Bantu kamu nemuin sendiri jawabannya.",
    sample: "“Kalau besok hal yang sama kejadian lagi, kira-kira apa yang paling kamu takutin?”",
  },
  {
    id: "realis",
    label: "Realis",
    blurb: "Hangat tapi jujur. Kalau ada pola yang ngerugiin kamu, dia bilang.",
    sample: "“Boleh aku jujur? Ini ketiga kalinya kamu cerita hal yang sama soal dia.”",
  },
  {
    id: "santai",
    label: "Santai",
    blurb: "Ngobrol kayak temen deket. Bisa becanda, tapi tau kapan serius.",
    sample: "“Ya ampun, pantesan. Itu mah siapa juga bakal kesel. Cerita dong, gimana ceritanya.”",
  },
];

const KEY = "feeling:persona:v1";

export const DEFAULT_PERSONA: Persona = { name: "Temen", style: "pendengar" };

export function loadPersona(): Persona | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p?.name || !p?.style) return null;
    return p as Persona;
  } catch {
    return null;
  }
}

export function savePersona(p: Persona): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
