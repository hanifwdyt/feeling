import "dotenv/config";
import express from "express";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chat, aiEnabled } from "./companion.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5192;

app.use(compression());
app.use(express.json({ limit: "128kb" }));
app.disable("x-powered-by");

const limiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });

app.get("/api/ai/status", (_req, res) => res.json({ enabled: aiEnabled() }));

app.post("/api/chat", limiter, async (req, res) => {
  if (!aiEnabled()) return res.status(503).json({ error: "AI belum diaktifkan." });

  const { persona, entry, messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "pesan kosong." });
  }

  try {
    const out = await chat({
      persona: persona ?? { name: "Teman", style: "pendengar" },
      entry: entry ?? null,
      messages,
    });
    res.json(out);
  } catch (err) {
    console.error("[chat]", err?.message ?? err);
    res.status(502).json({ error: "Gagal menghubungi AI. Coba lagi." });
  }
});

// ── static SPA ───────────────────────────────────────────────────────────────
const dist = path.join(__dirname, "..", "dist");
app.use(
  express.static(dist, {
    setHeaders: (res, p) => {
      if (p.endsWith("index.html")) res.setHeader("Cache-Control", "no-cache");
      else if (p.includes("/assets/"))
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);
app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));

app.listen(PORT, () => {
  console.log(`feeling.hanif.app → http://localhost:${PORT}`);
  console.log(`AI temen curhat: ${aiEnabled() ? "aktif" : "NONAKTIF (API key kosong)"}`);
});
