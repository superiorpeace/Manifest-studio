"use client";
import { useState } from "react";
import { NICHES, TONES } from "@/lib/types";
import styles from "./AffirmationsDrawer.module.css";

interface Props {
  onInsert: (text: string) => void;
  onClose: () => void;
}

export default function AffirmationsDrawer({ onInsert, onClose }: Props) {
  const [niche, setNiche]               = useState("self-love");
  const [tone, setTone]                 = useState("empowering");
  const [count, setCount]               = useState(6);
  const [results, setResults]           = useState<string[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [copied, setCopied]             = useState<number | null>(null);

  const generate = async () => {
    setLoading(true); setError(""); setResults([]);
    try {
      const res = await fetch("/api/affirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, tone, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.affirmations);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1400);
  };

  const nicheObj = NICHES.find(n => n.id === niche);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.drawer}>
        {/* Header */}
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <span className={styles.headIcon}>✦</span>
            <div>
              <h2 className={styles.title}>AI Affirmations</h2>
              <p className={styles.sub}>Generate viral captions for Instagram</p>
            </div>
          </div>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {/* Niche */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Niche</label>
            <div className={styles.nicheGrid}>
              {NICHES.map(n => (
                <button
                  key={n.id}
                  className={`${styles.nicheBtn} ${niche === n.id ? styles.nicheBtnOn : ""}`}
                  onClick={() => setNiche(n.id)}
                >
                  <span className={styles.nicheEmoji}>{n.emoji}</span>
                  <span>{n.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Tone</label>
            <div className={styles.toneGrid}>
              {TONES.map(t => (
                <button
                  key={t.id}
                  className={`${styles.toneBtn} ${tone === t.id ? styles.toneBtnOn : ""}`}
                  onClick={() => setTone(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>How many?</label>
            <div className={styles.countRow}>
              {[3,6,9,12].map(n => (
                <button key={n}
                  className={`${styles.countBtn} ${count === n ? styles.countBtnOn : ""}`}
                  onClick={() => setCount(n)}>{n}</button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button className={`${styles.genBtn} ${loading ? styles.genBtnLoading : ""}`} onClick={generate} disabled={loading}>
            {loading ? (
              <><span className={styles.spinner} /> Generating {count} affirmations…</>
            ) : (
              <><span className={styles.genIcon}>✦</span> Generate for {nicheObj?.label}</>
            )}
          </button>

          {error && <div className={styles.error}>{error}</div>}

          {/* Results */}
          {results.length > 0 && (
            <div className={styles.results}>
              <p className={styles.resultsLabel}>{results.length} affirmations · drag or click to add to canvas</p>
              <div className={styles.list}>
                {results.map((text, i) => (
                  <div
                    key={i}
                    className={styles.card}
                    draggable
                    onDragStart={e => e.dataTransfer.setData("text/plain", text)}
                    style={{ animationDelay: `${i * 55}ms` }}
                  >
                    <p className={styles.cardText}>{text}</p>
                    <div className={styles.cardRow}>
                      <button className={styles.cardBtn} onClick={() => onInsert(text)}>
                        + Add to canvas
                      </button>
                      <button
                        className={`${styles.cardBtn} ${copied === i ? styles.cardBtnCopied : ""}`}
                        onClick={() => copy(text, i)}
                      >
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
