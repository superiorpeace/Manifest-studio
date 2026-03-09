"use client";
import { useState } from "react";
import { NICHES, TONES } from "@/lib/types";
import styles from "./AffirmationsDrawer.module.css";

interface Props {
  onInsert: (text: string) => void;
  onClose: () => void;
}

type Mode = "affirmations" | "captions";

export default function AffirmationsDrawer({ onInsert, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("affirmations");

  // Affirmations state
  const [niche, setNiche]   = useState("self-love");
  const [tone, setTone]     = useState("empowering");
  const [count, setCount]   = useState(6);

  // Captions state
  const [topic, setTopic]   = useState("");
  const [capTone, setCapTone] = useState("empowering");
  const [capCount, setCapCount] = useState(5);

  const [results, setResults]   = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState<number | null>(null);

  const generate = async () => {
    if (mode === "captions" && !topic.trim()) {
      setError("Please enter a topic first"); return;
    }
    setLoading(true); setError(""); setResults([]);
    try {
      const body = mode === "affirmations"
        ? { mode: "affirmations", niche, tone, count }
        : { mode: "captions", topic: topic.trim(), tone: capTone, count: capCount };

      const res = await fetch("/api/affirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResults(data.results);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i); setTimeout(() => setCopied(null), 1400);
  };

  const nicheObj = NICHES.find(n => n.id === niche);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.drawer}>
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <span className={styles.headIcon}>✦</span>
            <div>
              <h2 className={styles.title}>AI Content</h2>
              <p className={styles.sub}>Affirmations & captions for Instagram</p>
            </div>
          </div>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        {/* Mode tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${mode === "affirmations" ? styles.tabOn : ""}`} onClick={() => { setMode("affirmations"); setResults([]); }}>
            ✦ Affirmations
          </button>
          <button className={`${styles.tab} ${mode === "captions" ? styles.tabOn : ""}`} onClick={() => { setMode("captions"); setResults([]); }}>
            ✍ Captions
          </button>
        </div>

        <div className={styles.body}>
          {mode === "affirmations" ? (
            <>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Niche</label>
                <div className={styles.nicheGrid}>
                  {NICHES.map(n => (
                    <button key={n.id} className={`${styles.nicheBtn} ${niche === n.id ? styles.nicheBtnOn : ""}`} onClick={() => setNiche(n.id)}>
                      <span className={styles.nicheEmoji}>{n.emoji}</span>
                      <span>{n.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Tone</label>
                <div className={styles.toneGrid}>
                  {TONES.map(t => (
                    <button key={t.id} className={`${styles.toneBtn} ${tone === t.id ? styles.toneBtnOn : ""}`} onClick={() => setTone(t.id)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>How many?</label>
                <div className={styles.countRow}>
                  {[3,6,9,12].map(n => (
                    <button key={n} className={`${styles.countBtn} ${count === n ? styles.countBtnOn : ""}`} onClick={() => setCount(n)}>{n}</button>
                  ))}
                </div>
              </div>
              <button className={`${styles.genBtn} ${loading ? styles.genBtnLoading : ""}`} onClick={generate} disabled={loading}>
                {loading ? <><span className={styles.spinner} /> Generating…</> : <><span>✦</span> Generate for {nicheObj?.label}</>}
              </button>
            </>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Your topic or idea</label>
                <textarea
                  className={styles.topicInput}
                  placeholder="e.g. morning routine, self confidence after heartbreak, manifesting your dream life, gym motivation..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Tone</label>
                <div className={styles.toneGrid}>
                  {TONES.map(t => (
                    <button key={t.id} className={`${styles.toneBtn} ${capTone === t.id ? styles.toneBtnOn : ""}`} onClick={() => setCapTone(t.id)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>How many?</label>
                <div className={styles.countRow}>
                  {[3,5,8,10].map(n => (
                    <button key={n} className={`${styles.countBtn} ${capCount === n ? styles.countBtnOn : ""}`} onClick={() => setCapCount(n)}>{n}</button>
                  ))}
                </div>
              </div>
              <button className={`${styles.genBtn} ${loading ? styles.genBtnLoading : ""}`} onClick={generate} disabled={loading || !topic.trim()}>
                {loading ? <><span className={styles.spinner} /> Generating…</> : <><span>✦</span> Generate Captions</>}
              </button>
            </>
          )}

          {error && <div className={styles.error}>{error}</div>}

          {results.length > 0 && (
            <div className={styles.results}>
              <p className={styles.resultsLabel}>{results.length} results · drag or click to add to canvas</p>
              <div className={styles.list}>
                {results.map((text, i) => (
                  <div key={i} className={styles.card} draggable
                    onDragStart={e => e.dataTransfer.setData("text/plain", text)}
                    style={{ animationDelay: `${i * 50}ms` }}>
                    <p className={styles.cardText}>{text}</p>
                    <div className={styles.cardRow}>
                      <button className={styles.cardBtn} onClick={() => onInsert(text)}>+ Add to canvas</button>
                      <button className={`${styles.cardBtn} ${copied === i ? styles.cardBtnCopied : ""}`} onClick={() => copy(text, i)}>
                        {copied === i ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
