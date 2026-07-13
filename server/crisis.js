// ─────────────────────────────────────────────────────────────────────────────
// THE CRISIS GUARD.
//
// This is the most important file in this app, and the one most likely to matter
// on the worst day of someone's life.
//
// An app people vent to WILL eventually receive someone in crisis. That is not a
// hypothetical edge case; it is a certainty given enough users and enough time.
// When it happens, the correct behaviour is not "a chatbot says something
// comforting" — it is "a human being who can actually help is put in front of
// them, immediately."
//
// So this check runs BEFORE the model is ever called, in code, on a keyword
// basis. We do not delegate this to the LLM's judgement, for the same reason we
// don't delegate a smoke alarm to a committee: it must fire even when everything
// else has failed.
//
// Deliberate design choices:
//   - It ERRS TOWARD FIRING. A false positive costs the user one gentle screen
//     they can dismiss. A false negative costs something we cannot get back.
//   - It does NOT refuse to keep talking. Cutting someone off mid-sentence when
//     they finally opened up is its own kind of harm. We surface help, and we
//     stay.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Indonesian + English phrasings of self-harm and suicidal intent, including the
 * indirect and euphemistic ways people actually say it — most people do not
 * announce it plainly.
 */
const CRISIS_PATTERNS = [
  // direct
  /\bbunuh diri\b/i,
  /\bmengakhiri hidup\b/i,
  /\bakhiri hidup\b/i,
  /\bmau mati\b/i,
  /\bpengen mati\b/i,
  /\bingin mati\b/i,
  /\bpengin mati\b/i,
  /\bpengen ngilang\b/i,
  /\bpengen hilang aja\b/i,
  /\bnyakitin diri\b/i,
  /\bmenyakiti diri\b/i,
  /\bself\s*harm\b/i,
  /\bmelukai diri\b/i,
  /\bpotong nadi\b/i,
  /\bgantung diri\b/i,
  /\boverdosis\b/i,
  /\bsuicide\b/i,
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bwant to die\b/i,

  // indirect / euphemistic — how it usually actually sounds
  /\b(gak|ga|nggak|tidak)\s+(mau|pengen|ingin)\s+hidup\b/i,
  /\b(lebih baik|mending)\s+(gue|aku|saya)\s+(mati|ilang|hilang|gak ada|ga ada)\b/i,
  /\bcapek hidup\b/i,
  /\blelah hidup\b/i,
  /\bpercuma hidup\b/i,
  /\bgak ada gunanya (gue|aku|saya) hidup\b/i,
  /\bdunia lebih baik tanpa (gue|aku|saya)\b/i,
  /\b(gue|aku|saya) (cuma|bikin) beban\b/i,
  /\btidak ada yang akan kehilangan\b/i,
  /\bpengen tidur (dan|terus) (gak|ga|nggak) bangun\b/i,
  /\bpengen berhenti aja\b/i,
];

export function isCrisis(text) {
  if (!text) return false;
  return CRISIS_PATTERNS.some((re) => re.test(String(text)));
}

/**
 * Shown ALONGSIDE the conversation, not instead of it.
 *
 * Numbers: 119 ext. 8 is Indonesia's Kemenkes SEJIWA mental-health line, routed
 * through the national health emergency number. 112 is the general emergency
 * line. Both are national and free.
 */
export const CRISIS_RESPONSE = {
  crisis: true,
  message:
    "Aku baca yang kamu tulis, dan aku nggak mau anggap itu angin lalu.\n\n" +
    "Aku cuma program — aku nggak bisa duduk di sebelahmu, dan untuk hal seberat ini kamu " +
    "pantas ngomong sama manusia beneran, bukan sama mesin.\n\n" +
    "Kalau kamu lagi kepikiran nyakitin diri sendiri, tolong hubungi salah satu ini sekarang:\n\n" +
    "• **119 ekstensi 8** — layanan kesehatan jiwa Kemenkes (SEJIWA), gratis, 24 jam\n" +
    "• **112** — nomor darurat nasional\n" +
    "• Atau bangunkan/telepon satu orang yang kamu percaya. Malam ini nggak harus kamu lewatin sendirian.\n\n" +
    "Kalau kamu lagi dalam bahaya langsung, tolong ke IGD terdekat.\n\n" +
    "Aku tetap di sini. Kalau kamu mau terus cerita, aku dengerin.",
};
