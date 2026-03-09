"use client";
import type { Layer, TextLayer, ImageLayer, VideoLayer } from "@/lib/types";
import { FONTS, IMG_FILTERS, BG_PRESETS } from "@/lib/types";
import styles from "./PropertiesPanel.module.css";

interface Props {
  selected: Layer | null;
  onUpdate: (patch: Partial<Layer>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onReorder: (dir: "up" | "down") => void;
  background: string;
  onChangeBackground: (v: string) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.control}>{children}</div>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, unit = "", onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <Row label={label}>
      <input type="range" className={styles.slider} min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)} />
      <span className={styles.val}>{unit === "%" ? Math.round(value * 100) + "%" : value + unit}</span>
    </Row>
  );
}

export default function PropertiesPanel({ selected, onUpdate, onDelete, onDuplicate, onReorder, background, onChangeBackground }: Props) {
  const t = selected?.type === "text"  ? selected as TextLayer  : null;
  const img = selected?.type === "image" ? selected as ImageLayer : null;
  const vid = selected?.type === "video" ? selected as VideoLayer : null;

  return (
    <aside className={styles.panel}>

      {/* ── Canvas BG ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Canvas</h3>
        <div className={styles.bgGrid}>
          {BG_PRESETS.map(bg => (
            <button
              key={bg}
              className={`${styles.bgSwatch} ${background === bg ? styles.bgActive : ""}`}
              style={{ background: bg }}
              onClick={() => onChangeBackground(bg)}
            />
          ))}
        </div>
        <Row label="Custom">
          <input type="color" className={styles.colorPick}
            value={background.startsWith("#") ? background : "#080706"}
            onChange={e => onChangeBackground(e.target.value)} />
        </Row>
      </section>

      {/* ── Layer props ── */}
      {selected ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.typeBadge}>{selected.type}</span>
            </h3>
            <div className={styles.layerBtns}>
              <button className={styles.iconBtn} onClick={() => onReorder("up")} title="Forward">↑</button>
              <button className={styles.iconBtn} onClick={() => onReorder("down")} title="Back">↓</button>
              <button className={styles.iconBtn} onClick={onDuplicate} title="Duplicate">⊕</button>
              <button className={`${styles.iconBtn} ${styles.delBtn}`} onClick={onDelete} title="Delete">✕</button>
            </div>
          </div>

          {/* Common */}
          <Slider label="Opacity" value={selected.opacity} min={0} max={1} step={0.01} unit="%" onChange={v => onUpdate({ opacity: v })} />
          <Slider label="Rotate"  value={selected.rotation} min={-180} max={180} unit="°" onChange={v => onUpdate({ rotation: v })} />

          <Row label="Size">
            <input type="number" className={styles.numInput} value={Math.round(selected.width)}
              onChange={e => onUpdate({ width: +e.target.value })} />
            <span className={styles.x}>×</span>
            <input type="number" className={styles.numInput} value={Math.round(selected.height)}
              onChange={e => onUpdate({ height: +e.target.value })} />
          </Row>

          {/* TEXT */}
          {t && (<>
            <Row label="Font">
              <select className={styles.select} value={t.fontFamily}
                onChange={e => onUpdate({ fontFamily: e.target.value })}>
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Row>
            <Slider label="Size" value={t.fontSize} min={8} max={140} unit="px" onChange={v => onUpdate({ fontSize: v })} />
            <Slider label="Spacing" value={t.letterSpacing} min={-5} max={20} unit="px" onChange={v => onUpdate({ letterSpacing: v })} />

            <Row label="Color">
              <input type="color" className={styles.colorPick} value={t.color}
                onChange={e => onUpdate({ color: e.target.value })} />
            </Row>
            <Row label="Align">
              <div className={styles.seg}>
                {(["left","center","right"] as const).map(a => (
                  <button key={a} className={`${styles.segBtn} ${t.textAlign === a ? styles.segActive : ""}`}
                    onClick={() => onUpdate({ textAlign: a })}>{a[0].toUpperCase()}</button>
                ))}
              </div>
            </Row>
            <Row label="Weight">
              <div className={styles.seg}>
                {([["300","Light"],["400","Regular"],["700","Bold"],["900","Black"]] as const).map(([v,l]) => (
                  <button key={v} className={`${styles.segBtn} ${t.fontWeight === v ? styles.segActive : ""}`}
                    onClick={() => onUpdate({ fontWeight: v })}>{l}</button>
                ))}
              </div>
            </Row>
            <Row label="Style">
              <div className={styles.seg}>
                <button className={`${styles.segBtn} ${t.fontStyle === "italic" ? styles.segActive : ""}`}
                  onClick={() => onUpdate({ fontStyle: t.fontStyle === "italic" ? "normal" : "italic" })}><i>I</i></button>
                <button className={`${styles.segBtn} ${t.textShadow ? styles.segActive : ""}`}
                  onClick={() => onUpdate({ textShadow: !t.textShadow })}>Shd</button>
              </div>
            </Row>
            <Row label="BG">
              <input type="color" className={styles.colorPick} value={t.bgColor}
                onChange={e => onUpdate({ bgColor: e.target.value })} />
              <input type="range" className={styles.slider} min={0} max={1} step={0.01} value={t.bgOpacity}
                onChange={e => onUpdate({ bgOpacity: +e.target.value })} style={{ flex: 1 }} />
            </Row>
            <Slider label="BG Radius" value={t.borderRadius} min={0} max={60} unit="px" onChange={v => onUpdate({ borderRadius: v })} />
          </>)}

          {/* IMAGE */}
          {img && (<>
            <Row label="Fit">
              <div className={styles.seg}>
                {(["cover","contain","fill"] as const).map(f => (
                  <button key={f} className={`${styles.segBtn} ${img.fit === f ? styles.segActive : ""}`}
                    onClick={() => onUpdate({ fit: f })}>{f}</button>
                ))}
              </div>
            </Row>
            <Row label="Filter">
              <select className={styles.select} value={img.filter}
                onChange={e => onUpdate({ filter: e.target.value })}>
                {IMG_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Row>
            <Slider label="Radius" value={img.borderRadius} min={0} max={60} unit="px" onChange={v => onUpdate({ borderRadius: v })} />
          </>)}

          {/* VIDEO */}
          {vid && (<>
            <Slider label="Radius" value={vid.borderRadius} min={0} max={60} unit="px" onChange={v => onUpdate({ borderRadius: v })} />
            <Row label="Loop">
              <button className={`${styles.toggle} ${vid.loop ? styles.toggleOn : ""}`}
                onClick={() => onUpdate({ loop: !vid.loop })} />
            </Row>
            <Row label="Muted">
              <button className={`${styles.toggle} ${vid.muted ? styles.toggleOn : ""}`}
                onClick={() => onUpdate({ muted: !vid.muted })} />
            </Row>
          </>)}
        </section>
      ) : (
        <div className={styles.empty}>
          <p>Select a layer<br />to edit properties</p>
        </div>
      )}
    </aside>
  );
}
