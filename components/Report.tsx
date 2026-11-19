"use client";

import { MermaidDiagram } from "./MermaidDiagram";
import { SeverityBadge } from "./SeverityBadge";
import { toMarkdown } from "../lib/markdown";
import { buildMermaid } from "../lib/mermaid";
import { countBySeverity, formatOwasp, OWASP_LLM_TOP_10_URL, uniqueOwaspIds } from "../lib/owasp";
import type { Features, GenerateResponse, Severity } from "../lib/schema";

const SEVERITY_LABELS: Severity[] = ["critical", "high", "medium", "low", "info"];

function componentName(response: GenerateResponse, id: string): string {
  return response.threatModel.components.find((c) => c.id === id)?.name ?? id;
}

function downloadMarkdown(response: GenerateResponse, features?: Features) {
  const markdown = toMarkdown(response.threatModel, {
    features,
    modelName: response.source === "example" ? "the sample report" : response.model,
  });
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const slug = response.threatModel.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "threat-model";
  anchor.href = url;
  anchor.download = `${slug}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Report({
  response,
  features,
}: {
  response: GenerateResponse;
  features?: Features;
}) {
  const { threatModel, source, model } = response;
  const counts = countBySeverity(threatModel.threats);
  const mermaid = buildMermaid(threatModel);
  const owaspCovered = uniqueOwaspIds(threatModel.threats);

  return (
    <section className="mt-10 space-y-8" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[#1f4e5a] uppercase">Threat model</p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold">{threatModel.title}</h2>
          <p className="mt-2 max-w-3xl text-[#57534e]">{threatModel.summary}</p>
          <p className="mt-2 text-sm text-[#57534e]">
            {source === "example"
              ? "Sample report included in the repository. Generate a fresh analysis to run the model."
              : `Generated with ${model}.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadMarkdown(response, features)}
          className="rounded-full border border-[#1f4e5a] px-4 py-2 text-sm font-medium text-[#1f4e5a] transition hover:bg-[#1f4e5a] hover:text-white"
        >
          Export Markdown
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {SEVERITY_LABELS.map((severity) => (
          <div key={severity} className="rounded-xl border border-[#ddd6cb] bg-white px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <SeverityBadge severity={severity} />
              <span className="text-xl font-semibold">{counts[severity]}</span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold">Data-flow diagram</h3>
        <p className="mt-1 mb-3 text-sm text-[#57534e]">Components are grouped by trust boundary.</p>
        <MermaidDiagram chart={mermaid} />
      </div>

      <div>
        <h3 className="text-lg font-semibold">Untrusted entry points</h3>
        <p className="mt-1 mb-3 text-sm text-[#57534e]">Every identified place untrusted text can enter the system.</p>
        <ul className="space-y-3">
          {threatModel.entryPoints.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-[#ddd6cb] bg-white p-4">
              <p className="font-semibold">{entry.name}</p>
              <p className="mt-1 text-sm text-[#57534e]">
                {componentName(response, entry.componentId)} · {entry.source}
              </p>
              <p className="mt-2">{entry.description}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold">Trust boundaries</h3>
          <ul className="mt-3 space-y-3">
            {threatModel.trustBoundaries.map((boundary) => (
              <li key={boundary.id} className="rounded-xl border border-[#ddd6cb] bg-white p-4">
                <p className="font-semibold">{boundary.name}</p>
                <p className="mt-1">{boundary.description}</p>
                <p className="mt-2 text-sm text-[#57534e]">
                  {boundary.componentIds.map((id) => componentName(response, id)).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Components</h3>
          <ul className="mt-3 space-y-3">
            {threatModel.components.map((component) => (
              <li key={component.id} className="rounded-xl border border-[#ddd6cb] bg-white p-4">
                <p className="font-semibold">{component.name}</p>
                <p className="mt-1 text-sm text-[#57534e]">
                  {component.type} · {component.trustLevel}
                </p>
                <p className="mt-2">{component.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">STRIDE threats</h3>
        <ul className="mt-3 space-y-4">
          {threatModel.threats.map((threat) => (
            <li key={threat.id} className="rounded-xl border border-[#ddd6cb] bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={threat.severity} />
                <span className="text-xs font-semibold tracking-wide text-[#57534e] uppercase">{threat.stride}</span>
                <span className="text-xs text-[#57534e]">{threat.id}</span>
              </div>
              <h4 className="mt-2 text-lg font-semibold">{threat.title}</h4>
              <p className="mt-1 text-sm text-[#57534e]">{componentName(response, threat.componentId)}</p>
              <p className="mt-2">{threat.description}</p>
              <p className="mt-2 text-sm">
                <span className="font-semibold">Mitigation: </span>
                {threat.mitigation}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {threat.owasp.map((ref) => (
                  <a
                    key={ref.id}
                    href={OWASP_LLM_TOP_10_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[#e4eef0] px-2.5 py-1 text-xs font-medium text-[#1f4e5a] hover:underline"
                  >
                    {formatOwasp(ref)}
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {owaspCovered.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold">OWASP LLM Top 10 (2025) coverage</h3>
          <p className="mt-1 text-sm text-[#57534e]">
            Categories referenced in this report, from the{" "}
            <a className="text-[#1f4e5a] underline" href={OWASP_LLM_TOP_10_URL} target="_blank" rel="noreferrer">
              OWASP Top 10 for LLM Applications
            </a>
            .
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {owaspCovered.map((id) => (
              <li key={id} className="rounded-full border border-[#ddd6cb] bg-white px-3 py-1 text-sm">
                {formatOwasp(id)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-[#57534e]">
        This report is an assistant to help you start a threat model. It is not a replacement for a professional
        security review.
      </p>
    </section>
  );
}
