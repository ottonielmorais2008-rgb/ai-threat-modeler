import { describe, expect, it } from "vitest";
import { exampleResults } from "../lib/example-results";
import { buildMermaid, mermaidId, mermaidLabel } from "../lib/mermaid";
import type { ThreatModel } from "../lib/schema";

describe("Mermaid generation", () => {
  it("sanitises ids and labels", () => {
    expect(mermaidId("user-browser")).toBe("user_browser");
    expect(mermaidId("2start")).toBe("n_2start");
    expect(mermaidId("???")).toBe("node");
    expect(mermaidLabel('Say "hello" [now]  and   more text that should be truncated at some point')).not.toContain('"');
    expect(mermaidLabel('Say "hello" [now]')).not.toContain("[");
    expect(mermaidLabel("a".repeat(80)).endsWith("…")).toBe(true);
  });

  it("groups components by trust boundary and draws labelled edges", () => {
    const model: ThreatModel = {
      title: "Test",
      summary: "Summary",
      components: [
        { id: "user-browser", name: "User", type: "client", description: "User", trustLevel: "untrusted" },
        { id: "api", name: "API", type: "api", description: "API", trustLevel: "trusted" },
        { id: "orphan", name: "Orphan", type: "other", description: "Unassigned", trustLevel: "trusted" },
      ],
      dataFlows: [
        { id: "f1", from: "user-browser", to: "api", data: 'Prompt "text"', crossesTrustBoundary: true },
        { id: "f-missing", from: "user-browser", to: "gone", data: "ignored", crossesTrustBoundary: false },
      ],
      trustBoundaries: [
        { id: "edge", name: "Internet", description: "Edge", componentIds: ["user-browser"] },
        { id: "app", name: "App zone", description: "App", componentIds: ["api"] },
      ],
      entryPoints: [{ id: "e1", name: "Prompt", componentId: "api", source: "User", description: "Text" }],
      threats: [
        {
          id: "T1",
          componentId: "api",
          stride: "Tampering",
          title: "Injection",
          description: "Injection",
          severity: "high",
          owasp: [{ id: "LLM01" }],
          mitigation: "Filter",
        },
      ],
    };

    const chart = buildMermaid(model);
    expect(chart.startsWith("flowchart LR")).toBe(true);
    expect(chart).toContain('subgraph');
    expect(chart).toContain("Internet");
    expect(chart).toContain("App zone");
    expect(chart).toContain("Other components");
    expect(chart).toContain("orphan");
    expect(chart).toContain("user_browser");
    expect(chart).toContain("-->");
    expect(chart).not.toContain("gone");
  });

  it("builds a diagram for each sample report", () => {
    for (const model of Object.values(exampleResults)) {
      const chart = buildMermaid(model);
      expect(chart).toContain("flowchart LR");
      expect(chart).toContain("-->");
      for (const component of model.components) {
        const id = component.id.replace(/[^A-Za-z0-9_]/g, "_");
        expect(chart.includes(id) || chart.toLowerCase().includes(component.name.toLowerCase().slice(0, 8))).toBe(true);
      }
    }
  });
});
