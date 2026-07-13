import { useState } from "react";
import { STYLE_OPTIONS, type Persona, type StyleId } from "../lib/persona";
import { Soft } from "./Soft";

/**
 * First run.
 *
 * The three promises are stated plainly, because they ARE the product — and
 * because two of them are things this app REFUSES to do. An app that buries its
 * refusals in a settings page isn't really making them.
 *
 * Register note: this copy used to open with "alat untuk melokalisir apa yang
 * kamu rasakan" — lab language, left over from an earlier direction. It's warm
 * now. The first thing an exhausted person reads should not sound like an
 * instrument manual.
 */
export function Onboarding({ onDone }: { onDone: (p: Persona) => void }) {
  const [name, setName] = useState("");
  const [style, setStyle] = useState<StyleId>("pendengar");
  const [custom, setCustom] = useState("");
  const [step, setStep] = useState<0 | 1>(0);

  return (
    <div className="room onboard">
      {step === 0 && (
        <div className="ob-panel">
          <h1 className="ob-mark">
            feeling<em>.</em>
          </h1>
          <p className="ob-lead">
            Tempat buat ngeloso dan cerita — terus pelan-pelan ngerti apa yang sebenernya kamu
            rasain.
          </p>

          <div className="tenets">
            <div className="tenet">
              <span className="no">01</span>
              <span>
                <b>Ngomong dulu, namanya belakangan.</b>
                <span>
                  Kamu sering nggak tau kamu ngerasa apa sampai kamu ngomongin dulu. Jadi di sini
                  nggak ada form yang harus diisi sebelum kamu boleh cerita.
                </span>
              </span>
            </div>
            <div className="tenet">
              <span className="no">02</span>
              <span>
                <b>Nggak ada streak.</b>
                <span>
                  Sengaja. Begitu kamu ngejar angka, kamu mulai nulis “aman aja” di hari yang nggak
                  aman — dan catatanmu jadi bohong.
                </span>
              </span>
            </div>
            <div className="tenet">
              <span className="no">03</span>
              <span>
                <b>Datanya tinggal di sini.</b>
                <span>
                  Nggak ada server, nggak ada akun. Nggak ada yang bisa baca — termasuk aku.
                </span>
              </span>
            </div>
          </div>

          <Soft className="soft-btn wide" onClick={() => setStep(1)}>
            Lanjut
          </Soft>
        </div>
      )}

      {step === 1 && (
        <div className="ob-panel">
          <h2>Siapa yang dengerin?</h2>
          <p className="ob-lead sm">
            Kamu yang nentuin dia kayak gimana. Dia AI — bukan psikolog, dan nggak bakal pura-pura
            jadi psikolog.
          </p>

          <label className="field-l" htmlFor="ob-name">
            Panggil dia apa
          </label>
          <input
            id="ob-name"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Temen"
            maxLength={40}
          />

          <label className="field-l">Cara dia nanggepin</label>
          <div className="voices">
            {STYLE_OPTIONS.map((s) => (
              <Soft
                key={s.id}
                className={`voice ${style === s.id ? "on" : ""}`}
                aria-pressed={style === s.id}
                onClick={() => setStyle(s.id)}
              >
                <b>{s.label}</b>
                <span className="blurb">{s.blurb}</span>
                <span className="sample">{s.sample}</span>
              </Soft>
            ))}
            <Soft
              className={`voice ${style === "custom" ? "on" : ""}`}
              aria-pressed={style === "custom"}
              onClick={() => setStyle("custom")}
            >
              <b>Tulis sendiri</b>
              <span className="blurb">Kamu yang nentuin karakternya.</span>
            </Soft>
          </div>

          {style === "custom" && (
            <textarea
              className="field"
              style={{ marginTop: "var(--space-md)" }}
              rows={3}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Sabar, nggak banyak omong, suka ngasih analogi, kadang nyeletuk…"
              maxLength={500}
              aria-label="Karakter kustom"
            />
          )}

          <Soft
            className="soft-btn wide"
            onClick={() => onDone({ name: name.trim() || "Temen", style, custom: custom.trim() })}
          >
            Mulai
          </Soft>
          <p className="ob-fine">
            Bisa diubah kapan aja. Kalau kamu nggak mau pakai AI sama sekali, tinggal nggak usah
            dibuka — sisa aplikasinya jalan penuh tanpa itu.
          </p>
        </div>
      )}
    </div>
  );
}
