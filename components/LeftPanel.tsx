"use client";
import { useRef } from "react";
import type { Layer, TextLayer, ImageLayer, VideoLayer, AudioLayer } from "@/lib/types";
import { uid, fileToDataURL } from "@/lib/utils";
import styles from "./LeftPanel.module.css";

interface Props {
  onAddLayer: (l: Layer) => void;
  layerCount: number;
}

export default function LeftPanel({ onAddLayer, layerCount }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const addText = () => {
    const l: TextLayer = {
      id: uid(), type: "text",
      x: 60, y: 80 + layerCount * 20,
      width: 380, height: 110,
      rotation: 0, opacity: 1, zIndex: layerCount,
      content: "Your caption here",
      fontSize: 36, fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: "700", fontStyle: "normal",
      color: "#ede8e0", textAlign: "center",
      textShadow: false, bgColor: "#000000", bgOpacity: 0,
      borderRadius: 0, letterSpacing: 0,
    };
    onAddLayer(l);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const src = await fileToDataURL(file);
      const base = { id: uid(), x: 40, y: 40, rotation: 0, opacity: 1, zIndex: layerCount };
      if (file.type.startsWith("image/")) {
        const l: ImageLayer = { ...base, type: "image", width: 300, height: 300, src, fit: "cover", borderRadius: 0, filter: "none" };
        onAddLayer(l);
      } else if (file.type.startsWith("video/")) {
        const l: VideoLayer = { ...base, type: "video", width: 340, height: 192, src, loop: true, muted: true, borderRadius: 0 };
        onAddLayer(l);
      } else if (file.type.startsWith("audio/")) {
        const l: AudioLayer = { ...base, type: "audio", width: 260, height: 72, src, fileName: file.name, volume: 1 };
        onAddLayer(l);
      }
    }
  };

  const tools = [
    { icon: "T", label: "Text", action: addText },
    { icon: "⊕", label: "Media", action: () => fileRef.current?.click() },
  ];

  return (
    <aside className={styles.panel}>
      <p className={styles.heading}>Add</p>
      <div className={styles.tools}>
        {tools.map(t => (
          <button key={t.label} className={styles.tool} onClick={t.action}>
            <span className={styles.toolIcon}>{t.icon}</span>
            <span className={styles.toolLabel}>{t.label}</span>
          </button>
        ))}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*,audio/*"
        multiple
        style={{ display: "none" }}
        onChange={e => handleFiles(e.target.files)}
      />
      <p className={styles.hint}>or drop files<br />onto the canvas</p>

      <div className={styles.divider} />

      <p className={styles.heading}>Formats</p>
      <div className={styles.formats}>
        {[["🖼️","Image","JPEG, PNG, WebP, GIF"],["🎬","Video","MP4, WebM, MOV"],["🎵","Audio","MP3, WAV, OGG"],["✍️","Text","Custom styling"]].map(([e,l,d]) => (
          <div key={l} className={styles.format}>
            <span className={styles.formatEmoji}>{e}</span>
            <div>
              <p className={styles.formatLabel}>{l}</p>
              <p className={styles.formatDesc}>{d}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
