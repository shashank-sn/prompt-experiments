import { NextRequest, NextResponse } from "next/server";
import { createPrompt, getAllPrompts } from "@/lib/db";

export async function GET() {
  const prompts = getAllPrompts();
  return NextResponse.json(prompts);
}

export async function POST(req: NextRequest) {
  const { title, description } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const id = createPrompt(title, description || "");
  return NextResponse.json({ id });
}
