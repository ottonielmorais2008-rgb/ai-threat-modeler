import { describe, expect, it } from "vitest";
import {
  countBySeverity,
  enrichOwasp,
  formatOwasp,
  getOwaspEntry,
  normalizeThreatModel,
  OWASP_IDS,
  sortThreats,
  uniqueOwaspIds,
} from "../lib/owasp";
import type { Threat, ThreatModel } from "../lib/schema";

const baseThreat = (over: Partial<Threat>): Threat => ({
  id: "T9",
  componentId: "api",
  stride: "Tampering",
  title: "Example",
  description: "A threat.",
  severity: "medium",
  owasp: [{ id: "LLM01" }],
  mitigation: "Fix it.",
  ...over,
});

describe("OWASP mapping helpers", () => {
  it("formats official 2025 IDs and titles", () => {
    expect(getOwaspEntry("LLM01").title).toBe("Prompt Injection");
    expect(formatOwasp("LLM06")).toBe("LLM06:2025 Excessive Agency");
    expect(formatOwasp({ id: "LLM08" })).toBe("LLM08:2025 Vector and Embedding Weaknesses");
    expect(OWASP_IDS).toHaveLength(10);
  });

  it("enriches refs with official titles and drops duplicates", () => {
    expect(enrichOwasp([{ id: "LLM01", title: "wrong" }, { id: "LLM01" }, { id: "LLM05" }])).toEqual([
      { id: "LLM01", title: "LLM01:2025 Prompt Injection" },
      { id: "LLM05", title: "LLM05:2025 Improper Output Handling" },
    ]);
  });

  it("sorts threats by severity then id and counts them", () => {
    const threats = [
      baseThreat({ id: "T2", severity: "low" }),
      baseThreat({ id: "T1", severity: "critical" }),
      baseThreat({ id: "T3", severity: "critical" }),
    ];
    expect(sortThreats(threats).map((t) => t.id)).toEqual(["T1", "T3", "T2"]);
    expect(countBySeverity(threats)).toEqual({ critical: 2, high: 0, medium: 0, low: 1, info: 0 });
  });

  it("normalises a model and lists unique OWASP IDs in official order", () => {
    const model: ThreatModel = {
      title: "Test",
      summary: "Summary",
      components: [{ id: "api", name: "API", type: "api", description: "API", trustLevel: "trusted" }],
      dataFlows: [{ id: "f1", from: "api", to: "api", data: "loop", crossesTrustBoundary: false }],
      trustBoundaries: [{ id: "b1", name: "App", description: "App", componentIds: ["api"] }],
      entryPoints: [{ id: "e1", name: "Prompt", componentId: "api", source: "User", description: "Text" }],
      threats: [
        baseThreat({ id: "T2", severity: "info", owasp: [{ id: "LLM10", title: "x" }] }),
        baseThreat({ id: "T1", severity: "high", owasp: [{ id: "LLM03" }, { id: "LLM03" }] }),
      ],
    };
    const normalised = normalizeThreatModel(model);
    expect(normalised.threats.map((t) => t.id)).toEqual(["T1", "T2"]);
    expect(normalised.threats[0]?.owasp).toEqual([{ id: "LLM03", title: "LLM03:2025 Supply Chain" }]);
    expect(uniqueOwaspIds(normalised.threats)).toEqual(["LLM03", "LLM10"]);
  });
});
