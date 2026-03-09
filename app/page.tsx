"use client";

import { useState, useCallback, useRef } from "react";
import type { Layer, TextLayer } from "@/lib/types";
import { uid } from "@/lib/utils";
import { exportCanvas } from "@/lib/export";
import Topbar from "@/components/Topbar";
import LeftPanel from "@/components/LeftPanel";
import Canvas from "@/components/Canvas";
import PropertiesPanel from "@/components/PropertiesPanel";
import LayersPanel from "@/components/LayersPanel";
import AffirmationsDrawer from "@/components/AffirmationsDrawer";
import styles from "./page.module.css";

// Canvas display size (matches Canvas.module.css .canvas dimensions)
const CANVAS_W = 480;
const CANVAS_H = 854;

export default function Page() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [background, setBackground] = useState("#080706");
  const [affirmationsOpen, setAffirmationsOpen] = useState(false);
  const [layersPanelOpen, setLayersPanelOpen] = useState(true);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const addLayer = useCallback((layer: Layer) => {
    setLayers(p => [...p, { ...layer, zIndex: p.length }]);
    setSelectedId(layer.id);
  }, []);

  const updateLayer = useCallback((id: string, patch: Partial<Layer>) => {
    setLayers(p => p.map(l => l.id === id ? { ...l, ...patch } as Layer : l));
  }, []);

  const deleteLayer = useCallback((id: string) => {
    setLayers(p => p.filter(l => l.id !== id));
    setSelectedId(prev => prev === id ? null : prev);
  }, []);

  const duplicateLayer = useCallback((id: string) => {
    const src = layers.find(l => l.id === id);
    if (!src) return;
    const clone: Layer = { ...src, id: uid(), x: src.x + 18, y: src.y + 18, zIndex: layers.length };
    setLayers(p => [...p, clone]);
    setSelectedId(clone.id);
  }, [layers]);

  const reorder = useCallback((id: string, dir: "up" | "down") => {
    setLayers(prev => {
      const arr = [...prev];
      const i = arr.findIndex(l => l.id === id);
      const target = dir === "up" ? i + 1 : i - 1;
      if (target < 0 || target >= arr.length) return prev;
      [arr[i].zIndex, arr[target].zIndex] = [arr[target].zIndex, arr[i].zIndex];
      return [...arr].sort((a, b) => a.zIndex - b.zIndex).map((l, idx) => ({ ...l, zIndex: idx }));
    });
  }, []);

  const clearAll = useCallback(() => { setLayers([]); setSelectedId(null); }, []);

  const doExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportCanvas(layers, background, CANVAS_W, CANVAS_H);
    } finally {
      setExporting(false);
    }
  }, [layers, background]);

  const insertText = useCallback((text: string) => {
    const layer: TextLayer = {
      id: uid(), type: "text",
      x: 60, y: 100, width: 400, height: 140,
      rotation: 0, opacity: 1, zIndex: layers.length,
      content: text, fontSize: 34,
      fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: "700", fontStyle: "italic",
      color: "#ede8e0", textAlign: "center",
      textShadow: true, bgColor: "#000000", bgOpacity: 0,
      borderRadius: 0, letterSpacing: 0,
    };
    addLayer(layer);
    setAffirmationsOpen(false);
  }, [layers.length, addLayer]);

  const selected = layers.find(l => l.id === selectedId) ?? null;

  return (
    <div className={styles.root}>
      <Topbar
        layerCount={layers.length}
        onClear={clearAll}
        onToggleAffirmations={() => setAffirmationsOpen(v => !v)}
        affirmationsOpen={affirmationsOpen}
        onExport={doExport}
        exporting={exporting}
        onToggleLayers={() => setLayersPanelOpen(v => !v)}
        layersPanelOpen={layersPanelOpen}
      />
      <div className={styles.workspace}>
        <LeftPanel onAddLayer={addLayer} layerCount={layers.length} />

        <Canvas
          layers={layers}
          selectedId={selectedId}
          background={background}
          onSelect={setSelectedId}
          onUpdateLayer={updateLayer}
          onAddLayer={addLayer}
          canvasRef={canvasRef}
        />

        <div className={styles.rightCol}>
          {layersPanelOpen && (
            <LayersPanel
              layers={layers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={deleteLayer}
              onDuplicate={duplicateLayer}
              onReorder={reorder}
              onVisibilityToggle={(id) => {
                const l = layers.find(x => x.id === id);
                if (l) updateLayer(id, { opacity: l.opacity > 0 ? 0 : 1 });
              }}
            />
          )}
          <PropertiesPanel
            selected={selected}
            onUpdate={(patch) => selected && updateLayer(selected.id, patch)}
            onDelete={() => selected && deleteLayer(selected.id)}
            onDuplicate={() => selected && duplicateLayer(selected.id)}
            onReorder={(dir) => selected && reorder(selected.id, dir)}
            background={background}
            onChangeBackground={setBackground}
          />
        </div>
      </div>

      {affirmationsOpen && (
        <AffirmationsDrawer
          onInsert={insertText}
          onClose={() => setAffirmationsOpen(false)}
        />
      )}
    </div>
  );
}
