"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import type { Layer, ImageLayer, VideoLayer, AudioLayer, TextLayer } from "@/lib/types";
import { uid, fileToDataURL, clamp, hexToRgba } from "@/lib/utils";
import styles from "./Canvas.module.css";

interface Props {
  layers: Layer[];
  selectedId: string | null;
  background: string;
  onSelect: (id: string | null) => void;
  onUpdateLayer: (id: string, patch: Partial<Layer>) => void;
  onAddLayer: (l: Layer) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

function VideoEl({ layer }: { layer: VideoLayer }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ref.current) return;
    if (ref.current.paused) { ref.current.play(); setPlaying(true); }
    else { ref.current.pause(); setPlaying(false); }
  };
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video ref={ref} src={layer.src} loop={layer.loop} muted={layer.muted} playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: layer.borderRadius, display: "block" }} />
      <button className={styles.playBtn} onClick={toggle}>{playing ? "⏸" : "▶"}</button>
    </div>
  );
}

function AudioEl({ layer }: { layer: AudioLayer }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const a = ref.current; if (!a) return;
    const t = () => setProgress(a.currentTime);
    const m = () => setDuration(a.duration);
    const e = () => setPlaying(false);
    a.addEventListener("timeupdate", t); a.addEventListener("loadedmetadata", m); a.addEventListener("ended", e);
    return () => { a.removeEventListener("timeupdate", t); a.removeEventListener("loadedmetadata", m); a.removeEventListener("ended", e); };
  }, []);
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ref.current) return;
    if (ref.current.paused) { ref.current.play(); setPlaying(true); }
    else { ref.current.pause(); setPlaying(false); }
  };
  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (!ref.current) return;
    ref.current.currentTime = +e.target.value; setProgress(+e.target.value);
  };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  return (
    <div className={styles.audioBlock}>
      <audio ref={ref} src={layer.src} />
      <button className={styles.audioPlayBtn} onClick={toggle}>{playing ? "⏸" : "▶"}</button>
      <div className={styles.audioRight}>
        <span className={styles.audioName}>{layer.fileName}</span>
        <div className={styles.audioSeekRow}>
          <input type="range" className={styles.audioSeek} min={0} max={duration || 100} step={0.1} value={progress}
            onChange={seek} onClick={e => e.stopPropagation()} />
          <span className={styles.audioTime}>{fmt(progress)} / {fmt(duration)}</span>
        </div>
        <div className={styles.audioWaveViz}>
          {[...Array(12)].map((_, i) => (
            <span key={i} className={`${styles.audioBar} ${playing ? styles.audioBarOn : ""}`}
              style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Canvas({ layers, selectedId, background, onSelect, onUpdateLayer, onAddLayer, canvasRef }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dragCount = useRef(0);

  const getPos = (e: React.DragEvent) => {
    if (!canvasRef.current) return { x: 80, y: 80 };
    const r = canvasRef.current.getBoundingClientRect();
    return { x: Math.max(0, e.clientX - r.left - 80), y: Math.max(0, e.clientY - r.top - 40) };
  };

  const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); dragCount.current++; setDragOver(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); if (--dragCount.current <= 0) { dragCount.current = 0; setDragOver(false); } };
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); dragCount.current = 0; setDragOver(false);
    const pos = getPos(e);
    const base = { id: uid(), ...pos, rotation: 0, opacity: 1, zIndex: layers.length };
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const src = await fileToDataURL(file);
      if (file.type.startsWith("image/"))
        onAddLayer({ ...base, id: uid(), type: "image", width: 300, height: 300, src, fit: "cover", borderRadius: 0, filter: "none" } as ImageLayer);
      else if (file.type.startsWith("video/"))
        onAddLayer({ ...base, id: uid(), type: "video", width: 340, height: 240, src, loop: true, muted: false, borderRadius: 8 } as VideoLayer);
      else if (file.type.startsWith("audio/"))
        onAddLayer({ ...base, id: uid(), type: "audio", width: 300, height: 90, src, fileName: file.name, volume: 1 } as AudioLayer);
    }
    const text = e.dataTransfer.getData("text/plain");
    if (text && files.length === 0) {
      onAddLayer({ ...base, id: uid(), type: "text", width: 380, height: 120, content: text, fontSize: 34,
        fontFamily: "'Playfair Display', Georgia, serif", fontWeight: "700", fontStyle: "italic",
        color: "#ede8e0", textAlign: "center", textShadow: true, bgColor: "#000000", bgOpacity: 0,
        borderRadius: 0, letterSpacing: 0 } as TextLayer);
    }
  }, [layers.length, onAddLayer]);

  const startMove = useCallback((e: React.MouseEvent, layer: Layer) => {
    if (editingId === layer.id) return;
    e.stopPropagation();
    onSelect(layer.id);
    const sx = e.clientX - layer.x, sy = e.clientY - layer.y;
    const bounds = canvasRef.current?.getBoundingClientRect();
    const move = (ev: MouseEvent) => {
      if (!bounds) return;
      onUpdateLayer(layer.id, {
        x: clamp(ev.clientX - sx, 0, bounds.width - layer.width),
        y: clamp(ev.clientY - sy, 0, bounds.height - layer.height),
      });
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  }, [editingId, onSelect, onUpdateLayer, canvasRef]);

  const startResize = useCallback((e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation();
    const ox = e.clientX, oy = e.clientY, ow = layer.width, oh = layer.height;
    const move = (ev: MouseEvent) => onUpdateLayer(layer.id, { width: Math.max(80, ow + ev.clientX - ox), height: Math.max(40, oh + ev.clientY - oy) });
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  }, [onUpdateLayer]);

  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className={styles.wrap}>
      <div ref={canvasRef} className={`${styles.canvas} ${dragOver ? styles.dragOver : ""}`}
        style={{ background }}
        onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
        onClick={e => { if (e.target === canvasRef.current) onSelect(null); }}>

        {layers.length === 0 && !dragOver && (
          <div className={styles.empty}>
            <div className={styles.emptyRing} />
            <span className={styles.emptyIcon}>✦</span>
            <p className={styles.emptyTitle}>Drop your media here</p>
            <p className={styles.emptyDesc}>Images · Videos · Audio · Text</p>
          </div>
        )}
        {dragOver && <div className={styles.dropFlash}><span className={styles.dropPlus}>+</span></div>}

        {sorted.map(layer => {
          const sel = layer.id === selectedId;
          const editing = layer.id === editingId;
          const tl = layer as TextLayer;

          return (
            <div key={layer.id}
              className={`${styles.layer} ${sel ? styles.selected : ""}`}
              style={{ left: layer.x, top: layer.y, width: layer.width, height: layer.height,
                transform: `rotate(${layer.rotation}deg)`, opacity: layer.opacity, zIndex: layer.zIndex + 1 }}
              onMouseDown={e => startMove(e, layer)}>

              {layer.type === "image" && (
                <img src={(layer as ImageLayer).src} alt="" draggable={false} style={{
                  width: "100%", height: "100%", objectFit: (layer as ImageLayer).fit,
                  filter: (layer as ImageLayer).filter, borderRadius: (layer as ImageLayer).borderRadius }} />
              )}
              {layer.type === "video" && <VideoEl layer={layer as VideoLayer} />}
              {layer.type === "audio" && <AudioEl layer={layer as AudioLayer} />}
              {layer.type === "text" && (
                editing ? (
                  <textarea className={styles.textEdit} defaultValue={tl.content} autoFocus
                    onBlur={e => { onUpdateLayer(layer.id, { content: e.target.value }); setEditingId(null); }}
                    style={{ fontSize: tl.fontSize, fontFamily: tl.fontFamily, fontWeight: tl.fontWeight,
                      fontStyle: tl.fontStyle, color: tl.color, textAlign: tl.textAlign,
                      letterSpacing: tl.letterSpacing, background: hexToRgba(tl.bgColor, tl.bgOpacity),
                      borderRadius: tl.borderRadius, textShadow: tl.textShadow ? "0 2px 16px rgba(0,0,0,.85)" : "none" }} />
                ) : (
                  <div className={styles.textDisplay}
                    onDoubleClick={e => { e.stopPropagation(); setEditingId(layer.id); }}
                    style={{ fontSize: tl.fontSize, fontFamily: tl.fontFamily, fontWeight: tl.fontWeight,
                      fontStyle: tl.fontStyle, color: tl.color, textAlign: tl.textAlign,
                      letterSpacing: tl.letterSpacing, background: hexToRgba(tl.bgColor, tl.bgOpacity),
                      borderRadius: tl.borderRadius, textShadow: tl.textShadow ? "0 2px 16px rgba(0,0,0,.85)" : "none",
                      lineHeight: 1.3, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {tl.content}
                    {sel && <span className={styles.editHint}>double-click to edit</span>}
                  </div>
                )
              )}
              {sel && !editing && <div className={styles.resizeHandle} onMouseDown={e => startResize(e, layer)} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
