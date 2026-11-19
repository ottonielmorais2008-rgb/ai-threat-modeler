"use client";

import { useMemo, useState } from "react";
import { Report } from "../components/Report";
import { examples, getExample } from "../lib/examples";
import { getExampleResult } from "../lib/example-results";
import {
  emptyFeatures,
  FEATURE_LABELS,
  featureKeys,
  MAX_DESCRIPTION_CHARS,
  MIN_DESCRIPTION_CHARS,
  type Features,
  type GenerateResponse,
} from "../lib/schema";

export default function Home() {
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<Features>(emptyFeatures());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [activeExample, setActiveExample] = useState<string | null>(null);

  const remaining = MAX_DESCRIPTION_CHARS - description.length;
  const canSubmit = useMemo(
    () => description.trim().length >= MIN_DESCRIPTION_CHARS && !loading,
    [description, loading],
  );

  function loadExample(id: string) {
    const example = getExample(id);
    const sample = getExampleResult(id);
    if (!example || !sample) return;
    setActiveExample(id);
    setDescription(example.description);
    setFeatures({ ...example.features });
    setError(null);
    setResult({ threatModel: sample, model: "sample", source: "example" });
  }

  function toggleFeature(key: (typeof featureKeys)[number]) {
    setActiveExample(null);
    setFeatures((current) => ({ ...current, [key]: !current[key] }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, features }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message = typeof data.error === "string" ? data.error : "Request failed.";
        if (activeExample) {
          const sample = getExampleResult(activeExample);
          if (sample && !result) {
            setResult({ threatModel: sample, model: "sample", source: "example" });
          }
        }
        throw new Error(message);
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold tracking-wide text-[#1f4e5a] uppercase">AI security</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl leading-tight font-semibold sm:text-5xl">
          AI Threat Modeler
        </h1>
        <p className="mt-3 text-lg text-[#57534e]">
          Describe an AI application and get a STRIDE threat model: components, trust boundaries, every place
          untrusted text can enter, and a mapping to the OWASP Top 10 for LLM Applications (2025).
        </p>
      </header>

      <div className="mt-8 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example.id}
            type="button"
            onClick={() => loadExample(example.id)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              activeExample === example.id
                ? "border-[#1f4e5a] bg-[#1f4e5a] text-white"
                : "border-[#ddd6cb] bg-white text-[#1c1917] hover:border-[#1f4e5a]"
            }`}
          >
            {example.title}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-[#57534e]">
        {activeExample
          ? (examples.find((example) => example.id === activeExample)?.blurb ?? "")
          : "Start from a ready example, or write your own description. Examples include a sample report so you can explore the UI even if the model is unavailable."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm font-semibold">Application description</span>
          <textarea
            value={description}
            onChange={(e) => {
              setActiveExample((current) => {
                const example = current ? getExample(current) : undefined;
                return example && e.target.value === example.description ? current : null;
              });
              setDescription(e.target.value);
            }}
            rows={8}
            maxLength={MAX_DESCRIPTION_CHARS}
            placeholder="What does the app do, who uses it, which models or tools it calls, and where user or document text enters the system?"
            className="mt-2 w-full rounded-xl border border-[#ddd6cb] bg-white px-3 py-2 outline-none focus:border-[#1f4e5a]"
          />
          <span className="mt-1 block text-xs text-[#57534e]">
            {description.trim().length}/{MAX_DESCRIPTION_CHARS} characters
            {remaining < 400 ? ` (${remaining} left)` : ""} · at least {MIN_DESCRIPTION_CHARS} required
          </span>
        </label>

        <fieldset>
          <legend className="text-sm font-semibold">Optional features</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {featureKeys.map((key) => (
              <label key={key} className="flex items-center gap-2 rounded-xl border border-[#ddd6cb] bg-white px-3 py-2">
                <input
                  type="checkbox"
                  checked={features[key]}
                  onChange={() => toggleFeature(key)}
                  className="size-4 accent-[#1f4e5a]"
                />
                <span className="text-sm">{FEATURE_LABELS[key]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-full bg-[#1f4e5a] px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-[#163943] disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate threat model"}
          </button>
          <p className="text-sm text-[#57534e]">Nothing is stored. The description is sent only to produce this report.</p>
        </div>
      </form>

      {error && (
        <p className="mt-6 rounded-xl border border-[#fde4e1] bg-[#fde4e1] px-4 py-3 text-[#b42318]" role="alert">
          {error}
        </p>
      )}

      {result && <Report response={result} features={features} />}
    </main>
  );
}
