import { NextRequest, NextResponse } from "next/server";
import { createExperiment, getExperiment, addExperimentResult, rankResult } from "@/lib/db";
import { isHyvAvailable, rewriteWithHyv } from "@/lib/hyv";

export async function POST(req: NextRequest) {
  const { promptId, title, inputData, versionIds } = await req.json();
  if (!promptId || !title || !inputData) {
    return NextResponse.json({ error: "promptId, title, and inputData required" }, { status: 400 });
  }

  const db = require("@/lib/db").getDb();

  let versions: any[];
  if (versionIds && versionIds.length > 0) {
    versions = versionIds.map((vid: string) =>
      db.prepare("SELECT * FROM prompt_versions WHERE id = ?").get(vid)
    ).filter(Boolean);
  } else {
    versions = db
      .prepare("SELECT * FROM prompt_versions WHERE prompt_id = ? ORDER BY version_number DESC LIMIT 6")
      .all(promptId);
  }

  if (versions.length === 0) {
    return NextResponse.json({ error: "No versions to test" }, { status: 400 });
  }

  const expId = createExperiment(promptId, title, inputData);
  const hyvReady = isHyvAvailable();

  const results = [];
  for (const ver of versions) {
    const output = simulateLlmCall(ver.content, inputData);
    const processedOutput = hyvReady ? rewriteWithHyv(output) : output;
    const resultId = addExperimentResult(expId, ver.id, processedOutput, hyvReady);
    results.push({
      id: resultId,
      versionId: ver.id,
      versionNumber: ver.version_number,
      strategy: ver.strategy,
      output: processedOutput,
    });
  }

  return NextResponse.json({ experimentId: expId, results });
}

function simulateLlmCall(promptContent: string, inputData: string): string {
  const strategies: Record<string, string> = {
    persuasive: "Listen, let me be direct: ",
    concise: "",
    contrarian: "Most people get this wrong. ",
    storytelling: "Let me share something that happened recently. ",
    "data-driven": "78% of professionals report that ",
    humorous: "",
  };

  const strategy = Object.entries(strategies).find(([k]) => promptContent.includes(k))?.[1] || "";
  const tone = promptContent.includes("persuasive")
    ? "With conviction and strong opinions. "
    : promptContent.includes("concise")
      ? "Short and punchy. "
      : promptContent.includes("contrarian")
        ? "Going against the grain here. "
        : promptContent.includes("storytelling")
          ? "Narrative-driven with examples. "
          : promptContent.includes("data-driven")
            ? "Backed by evidence. "
            : promptContent.includes("humorous")
              ? "Witty and entertaining. "
              : "";

  return `${strategy}${tone}Based on what you shared about "${inputData.substring(0, 80)}${inputData.length > 80 ? "..." : ""}" — here's the output generated with this approach. The key insight is that your content needs to resonate with the specific audience you're targeting. By focusing on clarity and emotional connection, you can achieve significantly better engagement.

${tone}The approach taken here emphasizes authentic communication over generic output. Results like this typically generate 3-5x more engagement than standard AI-generated content because they maintain a distinctive voice.`;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id param required" }, { status: 400 });
  const exp = getExperiment(id);
  if (!exp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(exp);
}

export async function PATCH(req: NextRequest) {
  const { resultId, rank } = await req.json();
  rankResult(resultId, rank);
  return NextResponse.json({ ok: true });
}
