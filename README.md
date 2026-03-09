# ✦ Manifest Studio

A premium Instagram content creation tool with drag-and-drop media canvas and AI-powered affirmation generation.

## Features

- 🖼️ **Drag & drop** images, videos, audio, and text onto a 9:16 canvas
- ✦ **AI Affirmations** — generate viral affirmations for 12 Instagram niches
- 🎨 **Full styling** — fonts, colors, filters, opacity, rotation, layers
- 📱 **Instagram-native** 9:16 canvas (1080×1920 ratio)
- ⬇️ **Export** canvas as PNG for posting

## Deploy to Vercel (2 minutes)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variable:
   - `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com)
4. Click Deploy ✓

## Local Development

```bash
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

- **Add media**: Click sidebar buttons or drag files directly onto the canvas
- **Select**: Click any element on the canvas
- **Move**: Drag selected elements
- **Resize**: Drag the corner handle
- **Edit text**: Double-click any text element
- **AI Affirmations**: Click the ✦ button, choose niche + tone, generate & drag to canvas
- **Export**: Click Export PNG in the top bar
