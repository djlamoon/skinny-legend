import { NextResponse } from "next/server";
import { analyzeWithModel, getProvider } from "@/lib/analyze-server";
import { mockAnalysis } from "@/lib/mock";

export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024; // stay under Vercel's 4.5 MB body limit
const ALLOWED = ["image/jpeg", "image/png"]; // what xAI vision accepts

/** Lets the UI know whether it's in demo mode (never reveals keys). */
export async function GET() {
  const p = getProvider();
  return NextResponse.json({ mode: p.kind === "mock" ? "mock" : "live", provider: p.kind });
}

export async function POST(request: Request) {
  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get("image");
    file = f instanceof File ? f : null;
  } catch {
    return NextResponse.json({ error: "Send multipart/form-data with an 'image' field." }, { status: 400 });
  }
  if (!file) return NextResponse.json({ error: "No image, no tea. Attach a photo." }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: `Unsupported image type ${file.type || "unknown"}.` }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That pic is too thicc (max 4 MB)." }, { status: 413 });
  }

  const provider = getProvider();
  if (provider.kind === "mock") {
    // MOCK MODE: no API key configured. Return labeled example data.
    await new Promise((r) => setTimeout(r, 1200));
    return NextResponse.json(mockAnalysis());
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buf.toString("base64")}`;
    const result = await analyzeWithModel(provider, dataUrl);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json(
      { error: "The AI had a moment. Try again, or log it manually.", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
