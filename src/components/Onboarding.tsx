import { useState } from "react";
import { STYLE_OPTIONS, type Persona, type StyleId } from "../lib/persona";

/**
 * First run. Two jobs: explain what this is honestly, and let the user build the
 * friend they'd actually talk to.
 *
 * We tell them up front that there are no streaks and that the journal stays on
 * the device — because both of those are the reasons to trust it, and burying
 * them in a settings page would waste them.
 */
export function Onboarding({ onDone }: { onDone: (p: Persona) => void }) {
  const [name, setName] = useState("");
  const [style, setStyle] = useState<StyleId>("pendengar");
  const [custom, setCustom] = useState("");
  const [step, setStep] = useState<0 | 1>(0);

  const finalName = name.trim() || "Temen";

  return (
    <div className="onboard">
      {step === 0 && (
        <div className="ob-panel">
          <h1>feeling</h1>
          <p className="ob-lead">
            Jurnal buat ngenalin apa yang kamu rasain — bukan cuma "lagi baik" atau "lagi
            nggak".
          </p>

          <div className="ob-points">
            <div>
              <b>Nama rasanya dulu, baru dirasain.</b>
              <span>
                Bisa bedain <i>kesal</i> dari <i>kecewa</i> itu bukan main kata. Orang yang bisa
                namain lebih presisi terbukti lebih tenang ngadepinnya.
              </span>
            </div>
            <div>
              <b>Nggak ada streak.</b>
              <span>
                Sengaja. Begitu kamu ngejar angka, kamu mulai ngisi "aman aja" di hari yang
                nggak aman — dan datanya jadi bohong.
              </span>
            </div>
            <div>
              <b>Datanya cuma di HP kamu.</b>
              <span>
                Nggak ada server, nggak ada akun. Nggak ada yang bisa baca — termasuk aku.
              </span>
            </div>
          </div>

          <button className="btn primary" onClick={() => setStep(1)}>
            Lanjut
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="ob-panel">
          <h2>Bikin temen curhatmu</h2>
          <p className="ob-lead sm">
            Nanti kamu bisa cerita ke dia soal apa yang kamu catat. Dia AI — bukan psikolog, dan
            nggak akan pura-pura jadi psikolog.
          </p>

          <label className="ob-label">Panggil dia apa?</label>
          <input
            className="ob-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Temen"
            maxLength={40}
          />

          <label className="ob-label">Gayanya gimana?</label>
          <div className="ob-styles">
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s.id}
                className={`ob-style ${style === s.id ? "on" : ""}`}
                onClick={() => setStyle(s.id)}
              >
                <b>{s.label}</b>
                <span className="blurb">{s.blurb}</span>
                <span className="sample">{s.sample}</span>
              </button>
            ))}
            <button
              className={`ob-style ${style === "custom" ? "on" : ""}`}
              onClick={() => setStyle("custom")}
            >
              <b>Tulis sendiri</b>
              <span className="blurb">Deskripsiin sendiri karakternya.</span>
            </button>
          </div>

          {style === "custom" && (
            <textarea
              className="ob-input"
              rows={3}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Contoh: sabar, nggak banyak omong, suka ngasih analogi, kadang nyeletuk lucu…"
              maxLength={500}
            />
          )}

          <button
            className="btn primary"
            onClick={() => onDone({ name: finalName, style, custom: custom.trim() })}
          >
            Mulai
          </button>
          <p className="ob-fine">
            Bisa diubah kapan aja nanti. Kalau kamu nggak mau pakai AI sama sekali, tinggal nggak
            usah dibuka — sisa aplikasinya jalan penuh tanpa itu.
          </p>
        </div>
      )}
    </div>
  );
}
