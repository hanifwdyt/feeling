import { useState } from "react";
import { STYLE_OPTIONS, type Persona, type StyleId } from "../lib/persona";

/**
 * First run.
 *
 * The three tenets are stated up front, numbered, because they ARE the product:
 * precision over comfort, honesty over engagement, privacy by construction. An
 * app that buries its position in a settings page doesn't really hold it.
 */
export function Onboarding({ onDone }: { onDone: (p: Persona) => void }) {
  const [name, setName] = useState("");
  const [style, setStyle] = useState<StyleId>("pendengar");
  const [custom, setCustom] = useState("");
  const [step, setStep] = useState<0 | 1>(0);

  return (
    <div className="onboard">
      {step === 0 && (
        <div className="ob-panel">
          <h1 className="ob-mark">
            feeling<em>.</em>
          </h1>
          <p className="ob-lead">
            Alat untuk melokalisir apa yang kamu rasakan — bukan sekadar “lagi baik” atau “lagi
            tidak”.
          </p>

          <div className="tenets">
            <div className="tenet">
              <span className="no">01</span>
              <span>
                <b>Namai dengan tepat.</b>
                <span>
                  Bisa membedakan <i>kesal</i> dari <i>kecewa</i> itu bukan main-main kata. Orang
                  yang menamai lebih presisi terbukti lebih tenang menghadapinya.
                </span>
              </span>
            </div>
            <div className="tenet">
              <span className="no">02</span>
              <span>
                <b>Tidak ada streak.</b>
                <span>
                  Sengaja. Begitu kamu mengejar angka, kamu mulai menulis “aman saja” di hari yang
                  tidak aman — dan datanya jadi bohong.
                </span>
              </span>
            </div>
            <div className="tenet">
              <span className="no">03</span>
              <span>
                <b>Datanya tinggal di sini.</b>
                <span>
                  Tidak ada server, tidak ada akun. Tidak ada yang bisa membacanya — termasuk aku.
                </span>
              </span>
            </div>
          </div>

          <button className="btn" onClick={() => setStep(1)}>
            Lanjut
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="ob-panel">
          <h2>Siapa yang mendengarkan?</h2>
          <p className="ob-lead sm">
            Nanti kamu bisa menceritakan catatanmu ke dia. Dia AI — bukan psikolog, dan tidak akan
            berpura-pura jadi psikolog.
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

          <label className="field-l">Cara dia menanggapi</label>
          <div className="voices">
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s.id}
                className={`voice ${style === s.id ? "on" : ""}`}
                aria-pressed={style === s.id}
                onClick={() => setStyle(s.id)}
              >
                <b>{s.label}</b>
                <span className="blurb">{s.blurb}</span>
                <span className="sample">{s.sample}</span>
              </button>
            ))}
            <button
              className={`voice ${style === "custom" ? "on" : ""}`}
              aria-pressed={style === "custom"}
              onClick={() => setStyle("custom")}
            >
              <b>Tulis sendiri</b>
              <span className="blurb">Kamu yang menentukan karakternya.</span>
            </button>
          </div>

          {style === "custom" && (
            <textarea
              className="field"
              style={{ marginTop: "var(--space-md)" }}
              rows={3}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Sabar, tidak banyak bicara, suka memberi analogi, sesekali menyeletuk…"
              maxLength={500}
              aria-label="Karakter kustom"
            />
          )}

          <button
            className="btn"
            onClick={() =>
              onDone({ name: name.trim() || "Temen", style, custom: custom.trim() })
            }
          >
            Mulai
          </button>
          <p className="ob-fine">
            Bisa diubah kapan saja. Kalau kamu tidak ingin memakai AI sama sekali, cukup jangan
            dibuka — sisa aplikasinya jalan penuh tanpa itu.
          </p>
        </div>
      )}
    </div>
  );
}
