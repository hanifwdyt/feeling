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

type Tab = "jurnal" | "pola";

export default function App() {
  const [persona, setPersona] = useState<Persona | null>(() => loadPersona());
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [tab, setTab] = useState<Tab>("jurnal");
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
    const t = setTimeout(() => setToast(null), 2600);
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
          setToast("Kecatat.");
        }}
      />
    );
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>feeling</h1>
          <p className="sub">
            {entries.length === 0
              ? "belum ada catatan"
              : `${entries.length} catatan · disimpan di HP ini`}
          </p>
        </div>
        <div className="top-act">
          <button className="icon" title="Backup ke file" onClick={exportJSON}>
            ↓
          </button>
          <button className="icon" title="Pulihkan dari file" onClick={() => fileRef.current?.click()}>
            ↑
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
                setToast(`${r.added} catatan ditambahkan.`);
              } catch {
                setToast("File-nya nggak kebaca.");
              }
              e.target.value = "";
            }}
          />
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === "jurnal" ? "on" : ""} onClick={() => setTab("jurnal")}>
          Jurnal
        </button>
        <button className={tab === "pola" ? "on" : ""} onClick={() => setTab("pola")}>
          Pola
        </button>
      </nav>

      <main className="body">
        {tab === "jurnal" ? (
          <History
            entries={entries}
            aiOn={aiOn}
            onTalk={(e) => setTalking(e)}
            onDelete={(id) => {
              setEntries(deleteEntry(id));
              setToast("Dihapus.");
            }}
          />
        ) : (
          <Insights entries={entries} />
        )}
      </main>

      <button className="fab" onClick={() => setCheckin(true)}>
        Lagi ngerasa apa?
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
