import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { niche, tone, count = 6 } = await req.json();

  const prompt = `You are a viral Instagram content strategist who knows exactly what stops the scroll in ${new Date().getFullYear()}.

Generate ${count} affirmations for the "${niche}" niche with a "${tone}" tone.

Rules:
- Each is 1–2 sentences, punchy and immediately quotable
- Vary lengths: some ultra-short (5 words), some medium (15–20 words)
- Sound real and human — not corporate or robotic
- Perfect for text overlays on Instagram Reels, Stories, and carousels
- Reference real trends: "that girl era", "main character energy", "soft life", "healing journey", "abundance mindset", "hot girl walk", "romanticize your life", etc. (use naturally, not forced)
- Make people want to save and share them

Return ONLY a raw JSON array of strings. No markdown, no extra text:
["affirmation one", "affirmation two", ...]`;

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

    const affirmations: string[] = JSON.parse(raw);
    return NextResponse.json({ affirmations });
  } catch (err) {
    console.error("Affirmation error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
