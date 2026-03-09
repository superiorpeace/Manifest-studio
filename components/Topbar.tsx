"use client";
import styles from "./Topbar.module.css";

interface Props {
  layerCount: number;
  onClear: () => void;
  onToggleAffirmations: () => void;
  affirmationsOpen: boolean;
  onExport: () => void;
  exporting: boolean;
  onToggleLayers: () => void;
  layersPanelOpen: boolean;
}

export default function Topbar({ layerCount, onClear, onToggleAffirmations, affirmationsOpen, onExport, exporting, onToggleLayers, layersPanelOpen }: Props) {
  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <span className={styles.logo}>MANIFEST</span>
        <span className={styles.sub}>STUDIO</span>
      </div>

      <div className={styles.center}>
        <span className={styles.status}>
          {layerCount === 0
            ? "drop media onto canvas · add text · generate affirmations"
            : `${layerCount} layer${layerCount !== 1 ? "s" : ""} on canvas`}
        </span>
      </div>

      <div className={styles.actions}>
        <button className={`${styles.btn} ${affirmationsOpen ? styles.btnActive : ""}`} onClick={onToggleAffirmations}>
          <span className={styles.sparkle}>✦</span> AI Content
        </button>
        <button className={`${styles.btn} ${layersPanelOpen ? styles.btnActive : ""}`} onClick={onToggleLayers}>
          ⊞ Layers
        </button>
        <div className={styles.sep} />
        <button
          className={`${styles.btn} ${styles.exportBtn}`}
          onClick={onExport}
          disabled={layerCount === 0 || exporting}
        >
          {exporting ? <><span className={styles.exportSpinner} /> Exporting…</> : "↓ Export PNG"}
        </button>
        <button className={`${styles.btn} ${styles.danger}`} onClick={onClear} disabled={layerCount === 0}>
          Clear
        </button>
      </div>
    </header>
  );
}
