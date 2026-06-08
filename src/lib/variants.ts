export const STRATEGIES = [
  { key: "persuasive", label: "Persuasive", description: "Stronger opinions and calls to action" },
  { key: "concise", label: "Concise", description: "Shorter, punchier output" },
  { key: "contrarian", label: "Contrarian", description: "Goes against conventional wisdom" },
  { key: "storytelling", label: "Storytelling", description: "Narrative-driven with examples" },
  { key: "data-driven", label: "Data-Driven", description: "Stats, numbers, and evidence" },
  { key: "humorous", label: "Humorous", description: "Witty and entertaining angle" },
];

export function generateVariantPrompt(baseContent: string, strategy: string): string {
  const modifiers: Record<string, string> = {
    persuasive:
      "Make it persuasive. Use stronger opinions, direct calls to action, and conviction. Challenge the reader.",
    concise:
      "Make it concise. Cut everything non-essential. Short sentences. Punchy delivery.",
    contrarian:
      "Make it contrarian. Go against conventional wisdom. Start with a surprising take that most people disagree with.",
    storytelling:
      "Make it storytelling-driven. Open with a specific example or anecdote. Build narrative tension.",
    "data-driven":
      "Make it data-driven. Include specific stats, numbers, or research. Cite evidence where possible.",
    humorous:
      "Make it humorous and witty. Use dry humor. Entertain while making the point.",
  };

  const modifier = modifiers[strategy] || "";
  return `${baseContent}

---
${modifier}`;
}

export function generateVariants(baseContent: string): Array<{ strategy: string; content: string }> {
  return STRATEGIES.map((s) => ({
    strategy: s.key,
    content: generateVariantPrompt(baseContent, s.key),
  }));
}
