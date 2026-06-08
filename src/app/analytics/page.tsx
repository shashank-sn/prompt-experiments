"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LeaderboardEntry {
  id: string;
  version_number: number;
  strategy: string;
  prompt_title: string;
  wins: number;
  total_experiments: number;
}

export default function AnalyticsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-3 inline-block">
        &larr; dashboard
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">analytics</h1>
      <p className="text-neutral-500 text-sm mb-10">which content strategies win most often?</p>

      {leaderboard.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-neutral-400">
            no data yet. run some experiments and rank the outputs to populate analytics.
          </p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="text-left px-5 py-3 font-medium">prompt</th>
                <th className="text-left px-5 py-3 font-medium">version</th>
                <th className="text-left px-5 py-3 font-medium">strategy</th>
                <th className="text-right px-5 py-3 font-medium">wins</th>
                <th className="text-right px-5 py-3 font-medium">experiments</th>
                <th className="text-right px-5 py-3 font-medium">win rate</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors">
                  <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400">{entry.prompt_title}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono font-medium">v{entry.version_number}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)]">
                      {entry.strategy}
                    </span>
                  </td>
                  <td className="text-right px-5 py-3 font-mono font-medium">{entry.wins}</td>
                  <td className="text-right px-5 py-3 text-neutral-400">{entry.total_experiments}</td>
                  <td className="text-right px-5 py-3 font-mono">
                    {entry.total_experiments > 0
                      ? `${Math.round((entry.wins / entry.total_experiments) * 100)}%`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
