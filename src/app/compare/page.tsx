"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Version {
  id: string;
  version_number: number;
  strategy: string;
  content: string;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const leftId = searchParams.get("left");
  const rightId = searchParams.get("right");

  const [left, setLeft] = useState<Version | null>(null);
  const [right, setRight] = useState<Version | null>(null);
  const [diff, setDiff] = useState<Array<{ type: "add" | "remove" | "same"; text: string }>>([]);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const res = await fetch("/api/prompts");
        const prompts = await res.json();
        for (const p of prompts) {
          const detailRes = await fetch(`/api/prompts/${p.id}`);
          const detail = await detailRes.json();
          if (detail.versions) {
            for (const v of detail.versions) {
              if (v.id === leftId) setLeft(v);
              if (v.id === rightId) setRight(v);
            }
          }
        }
      } catch {
        // handle gracefully
      }
    };
    if (leftId || rightId) fetchVersions();
  }, [leftId, rightId]);

  useEffect(() => {
    if (left && right) {
      const leftLines = left.content.split("\n");
      const rightLines = right.content.split("\n");
      const result: Array<{ type: "add" | "remove" | "same"; text: string }> = [];
      const max = Math.max(leftLines.length, rightLines.length);
      for (let i = 0; i < max; i++) {
        const l = i < leftLines.length ? leftLines[i] : null;
        const r = i < rightLines.length ? rightLines[i] : null;

        if (l === r) {
          if (l !== null) result.push({ type: "same", text: l });
        } else {
          if (l !== null) result.push({ type: "remove", text: l });
          if (r !== null) result.push({ type: "add", text: r });
        }
      }
      setDiff(result);
    }
  }, [left, right]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {left && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">left:</span>
              <span className="font-mono text-sm font-medium">v{left.version_number}</span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)]">
                {left.strategy}
              </span>
            </div>
          )}
          <span className="text-neutral-300 dark:text-neutral-700">vs</span>
          {right && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">right:</span>
              <span className="font-mono text-sm font-medium">v{right.version_number}</span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)]">
                {right.strategy}
              </span>
            </div>
          )}
        </div>
      </div>

      {diff.length > 0 ? (
        <div className="border border-[var(--border)] rounded-xl overflow-hidden font-mono text-sm">
          <div className="divide-y divide-[var(--border)]">
            {diff.map((line, i) => (
              <div
                key={i}
                className={`px-5 py-2 ${
                  line.type === "add"
                    ? "bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100"
                    : line.type === "remove"
                      ? "bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100"
                      : "bg-[var(--background)]"
                }`}
              >
                <span className="w-6 inline-block text-xs text-neutral-400 mr-3">
                  {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
                </span>
                {line.text}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-sm text-neutral-400">
            {!leftId || !rightId
              ? "select two versions to compare by passing ?left=ID&right=ID"
              : "loading versions..."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-3 inline-block">
        &larr; dashboard
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mb-8">compare versions</h1>
      <Suspense fallback={<div className="text-sm text-neutral-400">loading...</div>}>
        <CompareContent />
      </Suspense>
    </div>
  );
}
