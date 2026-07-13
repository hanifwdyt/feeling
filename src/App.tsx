import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { History } from "./components/History";
import { Onboarding } from "./components/Onboarding";
import type { Draft } from "./components/CheckIn";
import type { Named } from "./components/Companion";

/* Split off everything the first paint doesn't need. The home screen is a couch
   and a list — the chat panel, the pattern charts and the quick-log flow are all
   behind a press, so they have no business blocking the couch from appearing. */
const Companion = lazy(() => import("./components/Companion").then((m) => ({ default: m.Companion })));
const Insights = lazy(() => import("./components/Insights").then((m) => ({ default: m.Insights })));
const CheckIn = lazy(() => import("./components/CheckIn").then((m) => ({ default: m.CheckIn })));
import { loadPersona, savePersona, type Persona } from "./lib/persona";
import { CottonCursor } from "./components/CottonCursor";
import { Soft } from "./components/Soft";
import { AnimatePresence, m } from "motion/react";
import {
  addEntry,
  deleteEntry,
  exportJSON,
  importJSON,
  loadEntries,
  type Entry,
} from "./lib/store";

type View = "home" | "pattern";

export default function App() {
  const [persona, setPersona] = useState<Persona | null>(() => loadPersona());
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [view, setView] = useState<View>("home");
  const [checkin, setCheckin] = useState(false);
  /** `null` + open = free venting (the primary path). An Entry = talking about it. */
  const [sofa, setSofa] = useState<{ entry: Entry | null } | null>(null);
  const [aiOn, setAiOn] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => setAiOn(!!d.enabled))
      .catch(() => setAiOn(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  if (!persona) {
    return (
      <Onboarding
        onDone={(p) => {
          savePersona(p);
          setPersona(p);
        }}
      />
    );
  }

  if (checkin) {
    return (
      <Suspense fallback={<div className="room" />}>
      <CheckIn
        onCancel={() => setCheckin(false)}
        onSave={(d: Draft) => {
          setEntries(addEntry(d));
          setCheckin(false);
          setToast("Kecatat");
        }}
      />
      </Suspense>
    );
  }

  return (
    <div className="room">
      <CottonCursor />
      <header className="head">
        <span className="logo">feeling</span>
        <nav className="nav">
          <Soft className={view === "home" ? "on" : ""} lift={0} sink={0} onClick={() => setView("home")}>
            Beranda
          </Soft>
          <Soft className={view === "pattern" ? "on" : ""} lift={0} sink={0} onClick={() => setView("pattern")}>
            Pola
          </Soft>
        </nav>
        <span className="io-group">
          <Soft className="io" onClick={exportJSON} title="Simpan salinan">
            ↓
          </Soft>
          <Soft className="io" onClick={() => fileRef.current?.click()} title="Pulihkan">
            ↑
          </Soft>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const r = await importJSON(f);
                setEntries(loadEntries());
                setToast(`+${r.added} catatan`);
              } catch {
                setToast("File nggak kebaca");
              }
              e.target.value = "";
            }}
          />
        </span>
      </header>

      {view === "home" ? (
        <main className="home">
          {/* ── THE SOFA ───────────────────────────────────────────────────
              The first and largest thing on the page. A tired person should be
              able to start talking without reading anything, deciding anything,
              or filling in anything. One press. */}
          <m.button
            className="couch"
            data-soft
            onClick={() => aiOn && setSofa({ entry: null })}
            whileHover={{ y: -5 }}
            whileTap={{ y: 7, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 260, damping: 28, mass: 1.1 }}
          >
            <div className="couch-seat">
              <h1>
                Cerita aja.
                <br />
                <em>Aku dengerin.</em>
              </h1>
              <p>
                Nggak usah rapi. Nggak usah tau kamu lagi ngerasa apa. Ngomong dulu — namanya
                belakangan.
              </p>
              {aiOn ? (
                <span className="couch-cta">Mulai cerita →</span>
              ) : (
                <span className="couch-off">
                  Teman ceritanya lagi nggak aktif. Kamu tetap bisa mencatat perasaan di bawah.
                </span>
              )}
            </div>
          </m.button>

          <Soft className="quick" sink={1} lift={0} onClick={() => setCheckin(true)}>
            atau <b>catat cepat</b> — kalau kamu udah tau rasanya apa
          </Soft>

          {entries.length > 0 && (
            <section className="recent">
              <h2 className="recent-t">Yang udah kamu ceritakan</h2>
              <History
                entries={entries}
                aiOn={aiOn}
                onTalk={(e) => setSofa({ entry: e })}
                onDelete={(id) => {
                  setEntries(deleteEntry(id));
                  setToast("Dihapus");
                }}
              />
            </section>
          )}
        </main>
      ) : (
        <main className="home">
          <Suspense fallback={null}>
            <Insights entries={entries} />
          </Suspense>
        </main>
      )}

      <AnimatePresence>
      {sofa && (
        <div className="overlay">
          <m.div
            className="veil"
            onClick={() => setSofa(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <Suspense fallback={null}>
          <Companion
            entry={sofa.entry}
            persona={persona}
            onClose={() => setSofa(null)}
            onSaveNamed={(n: Named) => {
              setEntries(
                addEntry({
                  x: n.quadrant === "red" || n.quadrant === "blue" ? -0.5 : 0.5,
                  y: n.quadrant === "red" || n.quadrant === "yellow" ? 0.5 : -0.5,
                  quadrant: n.quadrant,
                  word: n.word,
                  intensity: n.intensity,
                  contexts: [],
                  note: n.note,
                })
              );
              setSofa(null);
              setToast("Kecatat. Makasih udah cerita.");
            }}
          />
          </Suspense>
        </div>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <m.div
            className="toast"
            initial={{ y: 16, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            {toast}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
