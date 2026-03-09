import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { mode = "affirmations", niche, tone, count = 6, topic, capTone } = body;

  let prompt = "";

  if (mode === "captions") {
    prompt = `You are a viral Instagram content strategist for ${new Date().getFullYear()}.

The user wants captions/text overlays about: "${topic}"
Tone: "${tone || capTone || "empowering"}"
Generate ${count} captions.

Rules:
- Each is 1–2 sentences, punchy, quotable, scroll-stopping
- Mix lengths: some 5–8 words, some 15–20 words
- Sound real and human, not corporate
- Perfect as Instagram Reel text overlays, Stories captions, or carousel slides
- Use relevant trends naturally: "main character energy", "that girl era", "romanticize your life", "soft life", "healing era", etc.
- Make people want to save and share

Return ONLY a raw JSON array of strings, no markdown, no explanation:
["caption one", "caption two", ...]`;
  } else {
    prompt = `You are a viral Instagram content strategist for ${new Date().getFullYear()}.

Generate ${count} affirmations for the "${niche}" niche with a "${tone}" tone.

Rules:
- Each is 1–2 sentences, punchy and immediately quotable
- Vary lengths: some ultra-short (5 words), some medium (15–20 words)
- Sound real and human, not corporate
- Perfect as Instagram Reel text overlays, Stories, and carousels
- Reference real trends: "that girl era", "main character energy", "soft life", "healing journey", "abundance mindset", "hot girl walk", "romanticize your life" (use naturally)
- Make people want to save and share them

Return ONLY a raw JSON array of strings, no markdown, no extra text:
["affirmation one", "affirmation two", ...]`;
  }

  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const results: string[] = JSON.parse(raw);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Generation error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
