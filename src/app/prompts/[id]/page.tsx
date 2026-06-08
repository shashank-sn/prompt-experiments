"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { STRATEGIES } from "@/lib/variants";

interface Version {
  id: string;
  version_number: number;
  strategy: string;
  content: string;
  parent_version_id: string | null;
  created_at: string;
  wins: number;
}

interface LeaderboardEntry {
  id: string;
  version_number: number;
  strategy: string;
  wins: number;
  second_place: number;
  third_place: number;
  total_experiments: number;
}

interface PromptDetail {
  id: string;
  title: string;
  description: string;
  versions: Version[];
  leaderboard: LeaderboardEntry[];
}

export default function PromptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState<PromptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFork, setShowFork] = useState(false);
  const [forkContent, setForkContent] = useState("");
  const [forkStrategy, setForkStrategy] = useState("manual");
  const [showExperiment, setShowExperiment] = useState(false);
  const [experimentTitle, setExperimentTitle] = useState("");
  const [inputData, setInputData] = useState("");
  const [running, setRunning] = useState(false);

  const fetchPrompt = useCallback(async () => {
    const res = await fetch(`/api/prompts/${params.id}`);
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setPrompt(data);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    fetchPrompt();
  }, [fetchPrompt]);

  const handleFork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forkContent.trim()) return;
    await fetch(`/api/prompts/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: forkContent, strategy: forkStrategy }),
    });
    setShowFork(false);
    setForkContent("");
    fetchPrompt();
  };

  const handleRunExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputData.trim()) return;
    setRunning(true);
    const res = await fetch("/api/experiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        promptId: params.id,
        title: experimentTitle || "untitled experiment",
        inputData,
      }),
    });
    const data = await res.json();
    setRunning(false);
    setShowExperiment(false);
    setInputData("");
    setExperimentTitle("");
    router.push(`/experiments/${data.experimentId}`);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 w-64 bg-neutral-200 dark:bg-neutral-800 rounded" />
      </div>
    );
  }

  if (!prompt) return null;

  const latestVersion = prompt.versions[prompt.versions.length - 1];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-10">
        <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-3 inline-block">
          &larr; dashboard
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{prompt.title}</h1>
            {prompt.description && (
              <p className="text-neutral-500 text-sm mt-1">{prompt.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowExperiment(true)}
              className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              run experiment
            </button>
            <button
              onClick={() => {
                setForkContent(latestVersion?.content || "");
                setShowFork(true);
              }}
              className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              fork version
            </button>
          </div>
        </div>
      </div>

      {showFork && (
        <div className="mb-10 p-6 border border-[var(--border)] rounded-xl bg-[var(--muted)]">
          <h2 className="font-medium mb-4">fork new version</h2>
          <form onSubmit={handleFork} className="space-y-4">
            <textarea
              value={forkContent}
              onChange={(e) => setForkContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="your prompt content..."
            />
            <div className="flex items-center gap-3">
              <select
                value={forkStrategy}
                onChange={(e) => setForkStrategy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="manual">manual</option>
                {STRATEGIES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-sm font-medium"
              >
                create version
              </button>
              <button
                type="button"
                onClick={() => setShowFork(false)}
                className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showExperiment && (
        <div className="mb-10 p-6 border border-[var(--border)] rounded-xl bg-[var(--muted)]">
          <h2 className="font-medium mb-4">run experiment</h2>
          <form onSubmit={handleRunExperiment} className="space-y-4">
            <input
              type="text"
              placeholder="experiment name (optional)"
              value={experimentTitle}
              onChange={(e) => setExperimentTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="paste your notes, brief, or raw input here. all versions will be tested against this same input..."
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={running}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {running ? "running..." : "run experiment"}
              </button>
              <button
                type="button"
                onClick={() => setShowExperiment(false)}
                className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4">version tree</h2>
          <div className="space-y-2">
            {prompt.versions.map((v) => (
              <Link
                key={v.id}
                href={`/compare?left=${prompt.versions[0]?.id}&right=${v.id}`}
                className="block p-4 border border-[var(--border)] rounded-lg hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm font-medium">v{v.version_number}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-neutral-500">
                      {v.strategy}
                    </span>
                    {v.wins > 0 && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        {v.wins} wins
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400">{new Date(v.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2 font-mono">
                  {v.content}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4">leaderboard</h2>
          {prompt.leaderboard.length === 0 ? (
            <p className="text-sm text-neutral-400">run an experiment to populate the leaderboard</p>
          ) : (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                    <th className="text-left px-4 py-2 font-medium">version</th>
                    <th className="text-right px-4 py-2 font-medium">wins</th>
                  </tr>
                </thead>
                <tbody>
                  {prompt.leaderboard.map((entry) => (
                    <tr key={entry.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-2">
                        <span className="font-mono">v{entry.version_number}</span>
                        <span className="ml-2 text-xs text-neutral-400">{entry.strategy}</span>
                      </td>
                      <td className="text-right px-4 py-2 font-mono font-medium">{entry.wins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
