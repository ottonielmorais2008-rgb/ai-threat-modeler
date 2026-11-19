import {
  SEVERITY_ORDER,
  type OwaspId,
  type OwaspRef,
  type Severity,
  type Threat,
  type ThreatModel,
} from "./schema";

export const OWASP_LLM_TOP_10_URL = "https://genai.owasp.org/llm-top-10/";

export type OwaspEntry = {
  id: OwaspId;
  code: string;
  title: string;
};

export const OWASP_LLM_2025: Record<OwaspId, OwaspEntry> = {
  LLM01: { id: "LLM01", code: "LLM01:2025", title: "Prompt Injection" },
  LLM02: { id: "LLM02", code: "LLM02:2025", title: "Sensitive Information Disclosure" },
  LLM03: { id: "LLM03", code: "LLM03:2025", title: "Supply Chain" },
  LLM04: { id: "LLM04", code: "LLM04:2025", title: "Data and Model Poisoning" },
  LLM05: { id: "LLM05", code: "LLM05:2025", title: "Improper Output Handling" },
  LLM06: { id: "LLM06", code: "LLM06:2025", title: "Excessive Agency" },
  LLM07: { id: "LLM07", code: "LLM07:2025", title: "System Prompt Leakage" },
  LLM08: { id: "LLM08", code: "LLM08:2025", title: "Vector and Embedding Weaknesses" },
  LLM09: { id: "LLM09", code: "LLM09:2025", title: "Misinformation" },
  LLM10: { id: "LLM10", code: "LLM10:2025", title: "Unbounded Consumption" },
};

export const OWASP_IDS = Object.keys(OWASP_LLM_2025) as OwaspId[];

export function getOwaspEntry(id: OwaspId): OwaspEntry {
  return OWASP_LLM_2025[id];
}

export function formatOwasp(ref: OwaspRef | OwaspId): string {
  const id = typeof ref === "string" ? ref : ref.id;
  const entry = OWASP_LLM_2025[id];
  return `${entry.code} ${entry.title}`;
}

export function enrichOwasp(refs: OwaspRef[]): OwaspRef[] {
  const seen = new Set<OwaspId>();
  const enriched: OwaspRef[] = [];
  for (const ref of refs) {
    if (seen.has(ref.id)) continue;
    seen.add(ref.id);
    const entry = OWASP_LLM_2025[ref.id];
    enriched.push({ id: entry.id, title: `${entry.code} ${entry.title}` });
  }
  return enriched;
}

export function sortThreats(threats: Threat[]): Threat[] {
  return [...threats].sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return a.id.localeCompare(b.id);
  });
}

export function countBySeverity(threats: Threat[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const threat of threats) counts[threat.severity] += 1;
  return counts;
}

export function normalizeThreatModel(model: ThreatModel): ThreatModel {
  return {
    ...model,
    threats: sortThreats(
      model.threats.map((threat) => ({
        ...threat,
        owasp: enrichOwasp(threat.owasp),
      })),
    ),
  };
}

export function uniqueOwaspIds(threats: Threat[]): OwaspId[] {
  const seen = new Set<OwaspId>();
  for (const threat of threats) {
    for (const ref of threat.owasp) seen.add(ref.id);
  }
  return OWASP_IDS.filter((id) => seen.has(id));
}
