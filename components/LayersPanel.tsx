"use client";
import type { Layer } from "@/lib/types";
import styles from "./LayersPanel.module.css";

interface Props {
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReorder: (id: string, dir: "up" | "down") => void;
  onVisibilityToggle: (id: string) => void;
}

const TYPE_ICON: Record<string, string> = {
  image: "🖼",
  video: "🎬",
  audio: "🎵",
  text:  "✍",
};

export default function LayersPanel({ layers, selectedId, onSelect, onDelete, onDuplicate, onReorder, onVisibilityToggle }: Props) {
  const sorted = [...layers].sort((a, b) => b.zIndex - a.zIndex); // top layer first

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.title}>Layers</span>
        <span className={styles.count}>{layers.length}</span>
      </div>
      {layers.length === 0 ? (
        <p className={styles.empty}>No layers yet</p>
      ) : (
        <div className={styles.list}>
          {sorted.map((layer, i) => {
            const sel = layer.id === selectedId;
            const hidden = layer.opacity === 0;
            const name = layer.type === "text"
              ? (layer as { content?: string }).content?.slice(0, 22) + ((layer as { content?: string }).content?.length ?? 0 > 22 ? "…" : "")
              : `${layer.type} ${layers.length - i}`;

            return (
              <div
                key={layer.id}
                className={`${styles.item} ${sel ? styles.itemSel : ""} ${hidden ? styles.itemHidden : ""}`}
                onClick={() => onSelect(layer.id)}
              >
                <span className={styles.itemIcon}>{TYPE_ICON[layer.type]}</span>
                <span className={styles.itemName}>{name}</span>
                <div className={styles.itemActions} onClick={e => e.stopPropagation()}>
                  <button className={styles.iBtn} title="Toggle visibility"
                    onClick={() => onVisibilityToggle(layer.id)}>{hidden ? "○" : "●"}</button>
                  <button className={styles.iBtn} title="Move up"
                    onClick={() => onReorder(layer.id, "up")}>↑</button>
                  <button className={styles.iBtn} title="Move down"
                    onClick={() => onReorder(layer.id, "down")}>↓</button>
                  <button className={styles.iBtn} title="Duplicate"
                    onClick={() => onDuplicate(layer.id)}>⊕</button>
                  <button className={`${styles.iBtn} ${styles.iBtnDel}`} title="Delete"
                    onClick={() => onDelete(layer.id)}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
