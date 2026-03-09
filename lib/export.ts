import type { Layer, ImageLayer, VideoLayer, AudioLayer, TextLayer } from "./types";

export async function exportCanvas(
  layers: Layer[],
  background: string,
  width: number,
  height: number
): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) { alert("Canvas export not supported in this browser"); return; }

  // 1. Fill background
  if (background.startsWith("linear-gradient")) {
    // Parse simple linear-gradient for export
    const colors = background.match(/#[0-9a-fA-F]{6}/g);
    if (colors && colors.length >= 2) {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[colors.length - 1]);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = "#080706";
    }
  } else {
    ctx.fillStyle = background;
  }
  ctx.fillRect(0, 0, width, height);

  // 2. Sort layers by zIndex
  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of sorted) {
    if (layer.opacity === 0) continue;
    ctx.save();
    ctx.globalAlpha = layer.opacity;

    // Apply rotation around layer center
    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    if (layer.type === "image") {
      const il = layer as ImageLayer;
      await drawImage(ctx, il.src, layer.x, layer.y, layer.width, layer.height, il.fit, il.borderRadius);
    } else if (layer.type === "video") {
      const vl = layer as VideoLayer;
      // Find the video element on the page and capture its current frame
      const videoEl = document.querySelector(`video[src="${vl.src}"]`) as HTMLVideoElement | null;
      if (videoEl) {
        roundedRect(ctx, layer.x, layer.y, layer.width, layer.height, vl.borderRadius);
        ctx.clip();
        ctx.drawImage(videoEl, layer.x, layer.y, layer.width, layer.height);
      } else {
        // Fallback: dark placeholder with icon
        ctx.fillStyle = "rgba(16,14,12,0.9)";
        roundedRect(ctx, layer.x, layer.y, layer.width, layer.height, vl.borderRadius);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎬", layer.x + layer.width / 2, layer.y + layer.height / 2 + 12);
      }
    } else if (layer.type === "audio") {
      const al = layer as AudioLayer;
      // Draw audio block visual
      ctx.fillStyle = "rgba(16,14,12,0.9)";
      roundedRect(ctx, layer.x, layer.y, layer.width, layer.height, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Rose play button circle
      ctx.fillStyle = "#d4608a";
      ctx.beginPath();
      ctx.arc(layer.x + 28, layer.y + layer.height / 2, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("▶", layer.x + 28, layer.y + layer.height / 2 + 4);
      // Filename
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "9px DM Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText(al.fileName.slice(0, 30), layer.x + 52, layer.y + layer.height / 2 - 6);
      // Waveform bars
      for (let i = 0; i < 10; i++) {
        const bh = 4 + Math.sin(i * 1.2) * 10;
        ctx.fillStyle = "#d4608a";
        ctx.globalAlpha = 0.7 * layer.opacity;
        ctx.fillRect(layer.x + 52 + i * 8, layer.y + layer.height / 2 + 4 - bh / 2, 4, bh);
      }
    } else if (layer.type === "text") {
      const tl = layer as TextLayer;
      drawText(ctx, tl);
    }

    ctx.restore();
  }

  // 3. Download
  const link = document.createElement("a");
  link.download = `manifest-studio-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png", 1.0);
  link.click();
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function drawImage(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number, y: number, w: number, h: number,
  fit: string,
  radius: number
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      ctx.save();
      roundedRect(ctx, x, y, w, h, radius);
      ctx.clip();
      if (fit === "contain") {
        const scale = Math.min(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      } else if (fit === "fill") {
        ctx.drawImage(img, x, y, w, h);
      } else {
        // cover
        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      }
      ctx.restore();
      resolve();
    };
    img.onerror = () => resolve();
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function drawText(ctx: CanvasRenderingContext2D, tl: TextLayer) {
  const { x, y, width, height, fontSize, fontFamily, fontWeight, fontStyle,
          color, textAlign, bgColor, bgOpacity, borderRadius, textShadow, letterSpacing, content } = tl;

  // Background
  if (bgOpacity > 0) {
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${r},${g},${b},${bgOpacity})`;
    roundedRect(ctx, x, y, width, height, borderRadius);
    ctx.fill();
  }

  // Text shadow
  if (textShadow) {
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 2;
  }

  ctx.fillStyle = color;
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily.replace(/'/g, "")}`;
  ctx.textBaseline = "middle";

  const align = textAlign as CanvasTextAlign;
  ctx.textAlign = align;

  let anchorX = x + 10;
  if (align === "center") anchorX = x + width / 2;
  else if (align === "right") anchorX = x + width - 10;

  // Word wrap
  const words = content.split(" ");
  const lines: string[] = [];
  let line = "";
  const maxW = width - 20;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line); line = word;
    } else { line = test; }
  }
  if (line) lines.push(line);

  const lineH = fontSize * 1.3;
  const totalH = lines.length * lineH;
  let startY = y + height / 2 - totalH / 2 + lineH / 2;

  for (const l of lines) {
    ctx.fillText(l, anchorX, startY);
    startY += lineH;
  }

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}
