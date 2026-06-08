import { NextRequest, NextResponse } from "next/server";
import { getPrompt, createPromptVersion, getVersionTree, getLeaderboard } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prompt = getPrompt(id);
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const versions = getVersionTree(id);
  const leaderboard = getLeaderboard(id);
  return NextResponse.json({ ...prompt, versions, leaderboard });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = require("@/lib/db").getDb();
  const { id } = await params;
  db.prepare("DELETE FROM prompts WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { content, parentVersionId, strategy } = await req.json();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });
  const versionId = createPromptVersion(id, content, parentVersionId || null, strategy || "manual");
  return NextResponse.json({ id: versionId });
}
