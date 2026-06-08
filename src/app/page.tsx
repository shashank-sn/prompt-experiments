"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Prompt {
  id: string;
  title: string;
  description: string;
  version_count: number;
  experiment_count: number;
  created_at: string;
}

export default function Dashboard() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  const fetchPrompts = useCallback(async () => {
    const res = await fetch("/api/prompts");
    const data = await res.json();
    setPrompts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim() }),
    });
    const { id } = await res.json();
    setShowCreate(false);
    setTitle("");
    setDescription("");
    router.push(`/prompts/${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-4 w-96 bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">prompt experiments</h1>
          <p className="text-neutral-500 text-sm max-w-md">
            test content strategies side-by-side. find out which version actually wins, instead of
            guessing.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          new prompt
        </button>
      </div>

      {showCreate && (
        <div className="mb-10 p-6 border border-[var(--border)] rounded-xl bg-[var(--muted)]">
          <h2 className="font-medium mb-4">create a prompt to start experimenting</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="e.g. Write a LinkedIn post about startup growth"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              autoFocus
            />
            <textarea
              placeholder="brief description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-sm font-medium"
              >
                create
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {prompts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-400 text-sm mb-4">no prompts yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm text-neutral-600 dark:text-neutral-400 underline hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            create your first prompt to get started
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {prompts.map((p) => (
            <Link
              key={p.id}
              href={`/prompts/${p.id}`}
              className="block p-5 border border-[var(--border)] rounded-xl hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{p.title}</h3>
                  {p.description && (
                    <p className="text-sm text-neutral-500 mt-1 truncate">{p.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-neutral-400 shrink-0">
                  <span>{p.version_count} versions</span>
                  <span>{p.experiment_count} experiments</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
