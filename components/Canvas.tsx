"use client";
import { useRef, useState, useCallback } from "react";
import type { Layer, ImageLayer, VideoLayer, AudioLayer, TextLayer } from "@/lib/types";
import { uid, fileToDataURL, clamp } from "@/lib/utils";
import { hexToRgba } from "@/lib/utils";
import styles from "./Canvas.module.css";

interface Props {
  layers: Layer[];
  selectedId: string | null;
  background: string;
  onSelect: (id: string | null) => void;
  onUpdateLayer: (id: string, patch: Partial<Layer>) => void;
  onAddLayer: (l: Layer) => void;
}

export default function Canvas({ layers, selectedId, background, onSelect, onUpdateLayer, onAddLayer }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dragCount = useRef(0);

  const getPos = (e: React.DragEvent) => {
    if (!canvasRef.current) return { x: 80, y: 80 };
    const r = canvasRef.current.getBoundingClientRect();
    return { x: Math.max(0, e.clientX - r.left - 120), y: Math.max(0, e.clientY - r.top - 60) };
  };

  const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); dragCount.current++; setDragOver(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); if (--dragCount.current <= 0) { dragCount.current = 0; setDragOver(false); } };
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    dragCount.current = 0;
    setDragOver(false);
    const pos = getPos(e);
    const base = { id: uid(), ...pos, rotation: 0, opacity: 1, zIndex: layers.length };

    // File drops
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const src = await fileToDataURL(file);
      if (file.type.startsWith("image/")) {
        onAddLayer({ ...base, id: uid(), type: "image", width: 300, height: 300, src, fit: "cover", borderRadius: 0, filter: "none" } as ImageLayer);
      } else if (file.type.startsWith("video/")) {
        onAddLayer({ ...base, id: uid(), type: "video", width: 340, height: 192, src, loop: true, muted: true, borderRadius: 0 } as VideoLayer);
      } else if (file.type.startsWith("audio/")) {
        onAddLayer({ ...base, id: uid(), type: "audio", width: 260, height: 72, src, fileName: file.name, volume: 1 } as AudioLayer);
      }
    }

    // Text drag from affirmations
    const text = e.dataTransfer.getData("text/plain");
    if (text && files.length === 0) {
      onAddLayer({
        ...base, id: uid(), type: "text",
        width: 380, height: 120,
        content: text, fontSize: 34,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: "700", fontStyle: "italic",
        color: "#ede8e0", textAlign: "center",
        textShadow: true, bgColor: "#000000", bgOpacity: 0,
        borderRadius: 0, letterSpacing: 0,
      } as TextLayer);
    }
  }, [layers.length, onAddLayer]);

  // Inline drag-to-move
  const startMove = useCallback((e: React.MouseEvent, layer: Layer) => {
    if (editingId === layer.id) return;
    e.stopPropagation();
    onSelect(layer.id);
    const startX = e.clientX - layer.x;
    const startY = e.clientY - layer.y;
    const bounds = canvasRef.current?.getBoundingClientRect();

    const move = (ev: MouseEvent) => {
      if (!bounds) return;
      onUpdateLayer(layer.id, {
        x: clamp(ev.clientX - startX, 0, bounds.width  - layer.width),
        y: clamp(ev.clientY - startY, 0, bounds.height - layer.height),
      });
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, [editingId, onSelect, onUpdateLayer]);

  // Resize (bottom-right corner)
  const startResize = useCallback((e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation();
    const ox = e.clientX, oy = e.clientY, ow = layer.width, oh = layer.height;
    const move = (ev: MouseEvent) => onUpdateLayer(layer.id, {
      width:  Math.max(60,  ow + ev.clientX - ox),
      height: Math.max(30,  oh + ev.clientY - oy),
    });
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, [onUpdateLayer]);

  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  const isEmpty = layers.length === 0;

  return (
    <div className={styles.wrap}>
      <div
        ref={canvasRef}
        className={`${styles.canvas} ${dragOver ? styles.dragOver : ""}`}
        style={{ background }}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={e => { if (e.target === canvasRef.current) onSelect(null); }}
      >
        {isEmpty && !dragOver && (
          <div className={styles.empty}>
            <div className={styles.emptyRing} />
            <span className={styles.emptyIcon}>✦</span>
            <p className={styles.emptyTitle}>Drop your media here</p>
            <p className={styles.emptyDesc}>Images · Videos · Audio · Text</p>
          </div>
        )}

        {dragOver && (
          <div className={styles.dropFlash}>
            <span className={styles.dropPlus}>+</span>
          </div>
        )}

        {sorted.map(layer => {
          const sel = layer.id === selectedId;
          const editing = layer.id === editingId;

          return (
            <div
              key={layer.id}
              className={`${styles.layer} ${sel ? styles.selected : ""}`}
              style={{
                left: layer.x, top: layer.y,
                width: layer.width, height: layer.height,
                transform: `rotate(${layer.rotation}deg)`,
                opacity: layer.opacity,
                zIndex: layer.zIndex + 1,
              }}
              onMouseDown={e => startMove(e, layer)}
            >
              {/* ── Image ── */}
              {layer.type === "image" && (
                <img
                  src={(layer as ImageLayer).src}
                  alt=""
                  draggable={false}
                  style={{
                    width: "100%", height: "100%",
                    objectFit: (layer as ImageLayer).fit,
                    filter: (layer as ImageLayer).filter,
                    borderRadius: (layer as ImageLayer).borderRadius,
                  }}
                />
              )}

              {/* ── Video ── */}
              {layer.type === "video" && (
                <video
                  src={(layer as VideoLayer).src}
                  style={{
                    width: "100%", height: "100%", objectFit: "cover",
                    borderRadius: (layer as VideoLayer).borderRadius,
                  }}
                  loop={(layer as VideoLayer).loop}
                  muted={(layer as VideoLayer).muted}
                  autoPlay
                  playsInline
                />
              )}

              {/* ── Audio ── */}
              {layer.type === "audio" && (
                <div className={styles.audioBlock}>
                  <div className={styles.audioWave}>
                    {[...Array(7)].map((_, i) => (
                      <span key={i} className={styles.audioBar} style={{ animationDelay: `${i * 0.12}s` }} />
                    ))}
                  </div>
                  <div className={styles.audioInfo}>
                    <span className={styles.audioName}>{(layer as AudioLayer).fileName}</span>
                    <audio src={(layer as AudioLayer).src} controls className={styles.audioCtrl} />
                  </div>
                </div>
              )}

              {/* ── Text ── */}
              {layer.type === "text" && (
                editing ? (
                  <textarea
                    className={styles.textEdit}
                    defaultValue={(layer as TextLayer).content}
                    autoFocus
                    onBlur={e => { onUpdateLayer(layer.id, { content: e.target.value }); setEditingId(null); }}
                    style={{
                      fontSize: (layer as TextLayer).fontSize,
                      fontFamily: (layer as TextLayer).fontFamily,
                      fontWeight: (layer as TextLayer).fontWeight,
                      fontStyle: (layer as TextLayer).fontStyle,
                      color: (layer as TextLayer).color,
                      textAlign: (layer as TextLayer).textAlign,
                      letterSpacing: (layer as TextLayer).letterSpacing,
                      background: hexToRgba((layer as TextLayer).bgColor, (layer as TextLayer).bgOpacity),
                      borderRadius: (layer as TextLayer).borderRadius,
                      textShadow: (layer as TextLayer).textShadow ? "0 2px 16px rgba(0,0,0,.85)" : "none",
                    }}
                  />
                ) : (
                  <div
                    className={styles.textDisplay}
                    onDoubleClick={e => { e.stopPropagation(); setEditingId(layer.id); }}
                    style={{
                      fontSize: (layer as TextLayer).fontSize,
                      fontFamily: (layer as TextLayer).fontFamily,
                      fontWeight: (layer as TextLayer).fontWeight,
                      fontStyle: (layer as TextLayer).fontStyle,
                      color: (layer as TextLayer).color,
                      textAlign: (layer as TextLayer).textAlign,
                      letterSpacing: (layer as TextLayer).letterSpacing,
                      background: hexToRgba((layer as TextLayer).bgColor, (layer as TextLayer).bgOpacity),
                      borderRadius: (layer as TextLayer).borderRadius,
                      textShadow: (layer as TextLayer).textShadow ? "0 2px 16px rgba(0,0,0,.85)" : "none",
                      lineHeight: 1.3,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {(layer as TextLayer).content}
                    {sel && <span className={styles.editHint}>double-click to edit</span>}
                  </div>
                )
              )}

              {/* Resize handle */}
              {sel && !editing && (
                <div className={styles.resizeHandle} onMouseDown={e => startResize(e, layer)} />
              )}
            </div>
          );
        })}
      </div>

      {/* Phone frame notch */}
      <div className={styles.notch} />
    </div>
  );
}
