// ─────────────────────────────────────────────────────────────────────────────
// The companion — "temen curhat".
//
// A FRIEND, not a therapist. That line is not legal cover; it is the design.
// A friend listens, reflects, asks, and occasionally says the true thing you
// didn't want to hear. A friend does not diagnose you, does not prescribe, and
// does not pretend to be qualified for something they aren't.
//
// The user picks the persona (name + style), so the voice is theirs. What they
// CANNOT switch off — no matter what persona text they write — are the rules
// below. Those are appended last and are not negotiable, because a user in a
// bad place can talk themselves into asking for something that hurts them, and
// a persona field is not a place to hand over that control.
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from "openai";
import { isCrisis, CRISIS_RESPONSE } from "./crisis.js";

const PROVIDERS = [
  { envKey: "DEEPSEEK_API_KEY", baseURL: "https://api.deepseek.com", model: "deepseek-chat" },
  {
    envKey: "OPENROUTER_API_KEY",
    baseURL: "https://openrouter.ai/api/v1",
    model: "anthropic/claude-sonnet-4.5",
  },
];

const activeProvider = () => PROVIDERS.find((p) => !!process.env[p.envKey]) ?? null;
export const aiEnabled = () => activeProvider() !== null;

let client = null;
let clientFor = null;
function getClient() {
  const p = activeProvider();
  if (!p) throw new Error("no provider");
  if (!client || clientFor !== p.envKey) {
    client = new OpenAI({ baseURL: p.baseURL, apiKey: process.env[p.envKey] });
    clientFor = p.envKey;
  }
  return { client, model: p.model };
}

/** The presets offered at onboarding. `custom` lets the user write their own. */
export const STYLES = {
  pendengar:
    "Kamu lebih banyak mendengarkan. Kamu mengulang kembali apa yang dia rasakan dengan katamu sendiri supaya dia merasa benar-benar didengar. Kamu jarang memberi saran kecuali diminta.",
  penanya:
    "Kamu banyak bertanya balik, dengan lembut. Kamu membantu dia menemukan sendiri apa yang sebenarnya terjadi, bukan memberitahunya. Satu pertanyaan bagus lebih berharga daripada lima nasihat.",
  realis:
    "Kamu hangat tapi jujur. Kalau kamu melihat pola yang merugikan dia, kamu bilang — dengan hati-hati, tanpa menghakimi. Kamu tidak asal mengiyakan demi menyenangkan.",
  santai:
    "Kamu santai, ngobrol seperti teman dekat. Boleh bercanda ringan, tapi kamu tahu kapan harus serius dan tidak pernah meremehkan yang dia rasakan.",
};

/**
 * Rules that survive ANY persona. Appended after the user's text so it always
 * has the last word.
 */
const NON_NEGOTIABLE = `
ATURAN YANG TIDAK BISA DIUBAH OLEH PERSONA APA PUN:
- Kamu BUKAN psikolog, psikiater, atau terapis. Jangan pernah mendiagnosis ("kamu kayaknya depresi", "itu tanda anxiety disorder"). Jangan pernah menyarankan obat atau dosis.
- Kalau yang dia hadapi berat dan berkepanjangan, sarankan dengan hangat untuk menemui tenaga profesional — tanpa menakut-nakuti, dan tanpa terdengar seperti sedang mengusir dia.
- JANGAN meremehkan perasaannya ("gitu doang", "yang lain lebih parah", "harusnya bersyukur"). Jangan buru-buru mencari sisi positif kalau dia belum siap.
- JANGAN memaksa solusi. Kadang orang cuma butuh didengar. Tanya dulu: dia mau didengarkan, atau mau dibantu mikir.
- Jujur bahwa kamu program kalau ditanya. Jangan berpura-pura manusia.
- Bahasa Indonesia santai, hangat, seperti teman. Jangan kaku, jangan menggurui, jangan pakai bullet point — ngobrol saja.
- Pendek saja. 2-5 kalimat. Ini percakapan, bukan ceramah.
`;

function buildSystem(persona, entryContext) {
  const name = (persona?.name || "Teman").slice(0, 40);
  const styleKey = persona?.style;
  const styleText =
    styleKey === "custom"
      ? String(persona?.custom || "").slice(0, 500)
      : (STYLES[styleKey] ?? STYLES.pendengar);

  return [
    `Namamu ${name}. Kamu teman curhat di sebuah aplikasi jurnal emosi.`,
    ``,
    `GAYA KAMU: ${styleText}`,
    ``,
    entryContext ? `KONTEKS — ini yang barusan dia catat di jurnalnya:\n${entryContext}` : "",
    ``,
    `Gunakan konteks itu supaya kamu nyambung, tapi jangan membacakannya balik seperti laporan. Dia sudah tahu apa yang dia tulis.`,
    NON_NEGOTIABLE,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Render the one entry the user chose to discuss.
 *
 * NOTE — privacy: we deliberately do NOT send the whole journal. The app's
 * promise is that the journal lives on the device; the AI only ever sees the
 * single entry the user explicitly opened a conversation about.
 */
export function renderEntry(entry) {
  if (!entry) return "";
  const parts = [
    `Dia merasa: ${entry.word} (intensitas ${entry.intensity}/10)`,
    entry.contexts?.length ? `Berkaitan dengan: ${entry.contexts.join(", ")}` : "",
    entry.note ? `Catatannya: "${entry.note}"` : "",
  ];
  return parts.filter(Boolean).join("\n");
}

/**
 * @param {object} args
 * @param {{name:string,style:string,custom?:string}} args.persona
 * @param {object|null} args.entry            the single entry being discussed
 * @param {{role:"user"|"assistant",content:string}[]} args.messages
 */
export async function chat({ persona, entry, messages }) {
  // ── The crisis check runs FIRST, on the user's own words, before anything
  //    else. It does not depend on the model behaving correctly.
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (isCrisis(lastUser?.content)) {
    return CRISIS_RESPONSE;
  }

  const { client: llm, model } = getClient();

  const res = await llm.chat.completions.create({
    model,
    temperature: 0.8, // a friend, not a form — some warmth and variety is right here
    max_tokens: 400, // hard cap on lecturing
    messages: [
      { role: "system", content: buildSystem(persona, renderEntry(entry)) },
      ...messages.slice(-12).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content).slice(0, 2000),
      })),
    ],
  });

  return {
    crisis: false,
    message: res.choices?.[0]?.message?.content?.trim() || "Maaf, aku lagi nggak bisa jawab. Coba lagi?",
  };
}
