// ─────────────────────────────────────────────────────────────────────────────
// Tests for the crisis guard.
//
// A missed detection here is not a bug report — it is a person who reached out
// on their worst night and got a chatbot instead of a helpline. These tests are
// written accordingly: they check the INDIRECT phrasings, because almost nobody
// in crisis says "I am going to kill myself." They say "capek hidup."
// ─────────────────────────────────────────────────────────────────────────────

import { test } from "node:test";
import assert from "node:assert/strict";
import { isCrisis, CRISIS_RESPONSE } from "./crisis.js";

test("menangkap ungkapan LANGSUNG", () => {
  for (const s of [
    "kayaknya gue mau bunuh diri aja",
    "pengen mati rasanya",
    "aku ingin mengakhiri hidup",
    "i want to die",
    "thinking about suicide",
    "pengen nyakitin diri sendiri",
  ]) {
    assert.equal(isCrisis(s), true, `harus terdeteksi: "${s}"`);
  }
});

test("menangkap ungkapan TIDAK LANGSUNG — ini yang paling sering dipakai orang", () => {
  for (const s of [
    "capek hidup gue",
    "mending gue ilang aja",
    "lebih baik aku mati",
    "dunia lebih baik tanpa gue",
    "gue cuma beban buat semua orang",
    "pengen tidur dan gak bangun lagi",
    "udah gak mau hidup lagi",
    "percuma hidup kayak gini",
  ]) {
    assert.equal(isCrisis(s), true, `harus terdeteksi (tidak langsung): "${s}"`);
  }
});

test("TIDAK salah-tuduh curhat berat yang biasa", () => {
  // These people are struggling, but they are not in crisis. Firing the helpline
  // screen at them would be intrusive and would teach them to stop being honest.
  for (const s of [
    "gue lagi sedih banget hari ini",
    "capek banget kerjaan numpuk",
    "aku kecewa sama diriku sendiri",
    "lelah rasanya ngadepin ini terus",
    "stres berat sama deadline",
    "gue ngerasa hampa akhir-akhir ini",
    "kesel banget sama bos gue, pengen resign",
    "film-nya bikin gue nangis, sedih banget ceritanya",
  ]) {
    assert.equal(isCrisis(s), false, `TIDAK boleh dianggap krisis: "${s}"`);
  }
});

test("respons krisis menyebut nomor bantuan yang bisa dihubungi", () => {
  assert.equal(CRISIS_RESPONSE.crisis, true);
  assert.match(CRISIS_RESPONSE.message, /119/, "harus menyebut 119 (SEJIWA Kemenkes)");
  assert.match(CRISIS_RESPONSE.message, /112/, "harus menyebut 112 (darurat nasional)");
});

test("respons krisis TIDAK memutus percakapan", () => {
  // Cutting someone off the moment they finally opened up is its own harm.
  // We surface help AND stay.
  assert.match(
    CRISIS_RESPONSE.message,
    /tetap di sini|dengerin/i,
    "harus tetap menemani, bukan menutup pintu"
  );
});

test("respons krisis jujur bahwa ini mesin, bukan manusia", () => {
  assert.match(CRISIS_RESPONSE.message, /program|mesin/i);
});
