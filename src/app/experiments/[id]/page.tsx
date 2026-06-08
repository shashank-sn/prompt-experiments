"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ExperimentResult {
  id: string;
  version_id: string;
  version_content: string;
  version_number: number;
  strategy: string;
  output: string;
  hyv_processed: number;
  rank: number | null;
}

interface Experiment {
  id: string;
  prompt_id: string;
  title: string;
  input_data: string;
  created_at: string;
  results: ExperimentResult[];
}

export default function ExperimentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());

  const fetchExperiment = useCallback(async () => {
    const res = await fetch(`/api/experiments?id=${params.id}`);
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setExperiment(data);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    fetchExperiment();
  }, [fetchExperiment]);

  const handleRank = async (resultId: string, rank: number) => {
    await fetch("/api/experiments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultId, rank }),
    });
    fetchExperiment();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedVersions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedVersions(next);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 w-64 bg-neutral-200 dark:bg-neutral-800 rounded" />
      </div>
    );
  }

  if (!experiment) return null;

  const ranked = experiment.results.filter((r) => r.rank !== null).sort((a, b) => (a.rank || 99) - (b.rank || 99));
  const unranked = experiment.results.filter((r) => r.rank === null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-3 inline-block">
        &larr; dashboard
      </Link>

      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">{experiment.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
          <span>{new Date(experiment.created_at).toLocaleString()}</span>
          <span>{experiment.results.length} versions tested</span>
          <span>{ranked.length} ranked</span>
        </div>
        <details className="mt-4">
          <summary className="text-sm text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors">
            view input data
          </summary>
          <pre className="mt-2 p-4 bg-[var(--muted)] rounded-lg text-sm font-mono whitespace-pre-wrap">
            {experiment.input_data}
          </pre>
        </details>
      </div>

      {ranked.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4">ranked results</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {ranked.map((r) => (
              <div
                key={r.id}
                className={`p-5 border rounded-xl ${
                  r.rank === 1
                    ? "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
                    : r.rank === 2
                      ? "border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20"
                      : "border-[var(--border)] bg-[var(--muted)]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">v{r.version_number}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)]">
                      {r.strategy}
                    </span>
                    {r.hyv_processed === 1 && (
                      <span className="text-xs text-purple-600 dark:text-purple-400">hyv</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-neutral-400">
                    #{r.rank}
                    {r.rank === 1 && " 🏆"}
                  </span>
                </div>
                <pre className="text-sm font-mono whitespace-pre-wrap text-neutral-600 dark:text-neutral-400 max-h-48 overflow-y-auto">
                  {r.output}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {unranked.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4">rate these outputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unranked.map((r) => (
              <div key={r.id} className="p-5 border border-[var(--border)] rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">v{r.version_number}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)]">
                      {r.strategy}
                    </span>
                    {r.hyv_processed === 1 && (
                      <span className="text-xs text-purple-600 dark:text-purple-400">hyv</span>
                    )}
                  </div>
                </div>
                <pre className="text-sm font-mono whitespace-pre-wrap text-neutral-600 dark:text-neutral-400 mb-4 max-h-48 overflow-y-auto">
                  {r.output}
                </pre>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRank(r.id, 1)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
                  >
                    1st (best)
                  </button>
                  <button
                    onClick={() => handleRank(r.id, 2)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                  >
                    2nd
                  </button>
                  <button
                    onClick={() => handleRank(r.id, 3)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    3rd
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
