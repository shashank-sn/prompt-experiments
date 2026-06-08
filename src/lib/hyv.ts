import { execSync } from "child_process";

export interface HyvScanResult {
  hasAiPatterns: boolean;
  score: number;
  issues: string[];
  rawOutput: string;
}

export function scanWithHyv(text: string): HyvScanResult {
  try {
    const result = execSync("hyvoice scan -", {
      input: text,
      encoding: "utf-8",
      timeout: 15000,
    });
    return parseHyvOutput(result);
  } catch {
    return { hasAiPatterns: false, score: 100, issues: [], rawOutput: "" };
  }
}

export function rewriteWithHyv(text: string, profile?: string): string {
  try {
    const args = profile ? `--profile ${profile}` : "";
    const result = execSync(`hyvoice rewrite - ${args}`, {
      input: text,
      encoding: "utf-8",
      timeout: 15000,
    });
    return result.trim();
  } catch {
    return text;
  }
}

export function processVariantWithHyv(
  text: string,
  profile?: string
): { original: string; processed: string; hyvApplied: boolean } {
  const needed = isHyvAvailable();
  if (!needed) return { original: text, processed: text, hyvApplied: false };

  const rewritten = rewriteWithHyv(text, profile);
  return {
    original: text,
    processed: rewritten,
    hyvApplied: rewritten !== text,
  };
}

function parseHyvOutput(output: string): HyvScanResult {
  const lines = output.split("\n").filter((l) => l.trim());
  const issues = lines.filter((l) => l.includes("⚠") || l.includes("✗") || l.includes("AI"));
  return {
    hasAiPatterns: issues.length > 0,
    score: Math.max(0, 100 - issues.length * 10),
    issues,
    rawOutput: output,
  };
}

export function isHyvAvailable(): boolean {
  try {
    execSync("which hyvoice", { encoding: "utf-8", timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export function getHyvStatus(): { installed: boolean; version?: string } {
  try {
    if (!isHyvAvailable()) return { installed: false };
    const version = execSync("hyvoice --version", {
      encoding: "utf-8",
      timeout: 3000,
    }).trim();
    return { installed: true, version };
  } catch {
    return { installed: false };
  }
}
