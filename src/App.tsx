import { useEffect, useRef, useState } from "react";
import { CheckIn, type Draft } from "./components/CheckIn";
import { Insights, History } from "./components/Insights";
import { Companion } from "./components/Companion";
import { Onboarding } from "./components/Onboarding";
import { loadPersona, savePersona, type Persona } from "./lib/persona";
import {
  addEntry,
  deleteEntry,
  exportJSON,
  importJSON,
  loadEntries,
  type Entry,
} from "./lib/store";

type Tab = "ledger" | "pattern";

export default function App() {
  const [persona, setPersona] = useState<Persona | null>(() => loadPersona());
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [tab, setTab] = useState<Tab>("ledger");
  const [checkin, setCheckin] = useState(false);
  const [talking, setTalking] = useState<Entry | null>(null);
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
      <CheckIn
        onCancel={() => setCheckin(false)}
        onSave={(d: Draft) => {
          setEntries(addEntry(d));
          setCheckin(false);
          setToast("Tercatat");
        }}
      />
    );
  }

  return (
    <div className="app">
      <header className="top">
        <span className="mark">
          feeling<em>.</em>
        </span>
        <span className="meta">
          {entries.length === 0
            ? "kosong"
            : `${String(entries.length).padStart(2, "0")} catatan · lokal`}
        </span>
        <span className="top-act">
          <button className="io" onClick={exportJSON} title="Simpan salinan ke file">
            Ekspor
          </button>
          <button className="io" onClick={() => fileRef.current?.click()} title="Pulihkan dari file">
            Impor
          </button>
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
                setToast("File tidak terbaca");
              }
              e.target.value = "";
            }}
          />
        </span>
      </header>

      <nav className="tabs">
        <button className={tab === "ledger" ? "on" : ""} onClick={() => setTab("ledger")}>
          Catatan
        </button>
        <button className={tab === "pattern" ? "on" : ""} onClick={() => setTab("pattern")}>
          Pola
        </button>
      </nav>

      <main className="body">
        {tab === "ledger" ? (
          <History
            entries={entries}
            aiOn={aiOn}
            onTalk={(e) => setTalking(e)}
            onDelete={(id) => {
              setEntries(deleteEntry(id));
              setToast("Dihapus");
            }}
          />
        ) : (
          <Insights entries={entries} />
        )}
      </main>

      <button className="fab" onClick={() => setCheckin(true)}>
        Catat sekarang
      </button>

      {talking && (
        <div className="sheet">
          <div className="scrim" onClick={() => setTalking(null)} />
          <Companion entry={talking} persona={persona} onClose={() => setTalking(null)} />
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
