import { describe, expect, it } from "vitest";
import { exampleResults } from "../lib/example-results";
import { toMarkdown } from "../lib/markdown";
import { emptyFeatures } from "../lib/schema";

describe("markdown export", () => {
  const model = exampleResults["rag-chatbot"]!;

  it("includes title, summary, threats, mitigations and a mermaid fence", () => {
    const markdown = toMarkdown(model);
    expect(markdown).toContain(`# ${model.title}`);
    expect(markdown).toContain(model.summary);
    expect(markdown).toContain("## Untrusted entry points");
    expect(markdown).toContain("## Threats (STRIDE)");
    expect(markdown).toContain("```mermaid");
    expect(markdown).toContain("flowchart LR");
    expect(markdown).toContain("Mitigation:");
    expect(markdown).toContain("LLM01:2025 Prompt Injection");
  });

  it("lists declared features and the generator disclaimer when provided", () => {
    const features = { ...emptyFeatures(), usesRag: true, hasUserAccounts: true };
    const markdown = toMarkdown(model, { features, modelName: "gemini-3.5-flash-lite" });
    expect(markdown).toContain("Uses RAG / a document store");
    expect(markdown).toContain("Has user accounts");
    expect(markdown).not.toContain("Browses the web");
    expect(markdown).toContain("Generated with gemini-3.5-flash-lite");
    expect(markdown).toContain("not a replacement for a security review");
  });

  it("resolves component names in flows, entry points and threats", () => {
    const markdown = toMarkdown(model);
    expect(markdown).toContain("Employee browser → Chat web app");
    expect(markdown).toMatch(/via RAG orchestrator|via Application API|via Document pipeline/);
    expect(markdown).toContain("**Severity:** critical");
  });
});
