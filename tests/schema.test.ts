import { describe, expect, it } from "vitest";
import { exampleResults } from "../lib/example-results";
import {
  MAX_DESCRIPTION_CHARS,
  MIN_DESCRIPTION_CHARS,
  owaspIdSchema,
  threatModelSchema,
} from "../lib/schema";
import { parseFeatures, validateInput } from "../lib/validate";

const validModel = {
  title: "Demo app",
  summary: "A short summary of the system under review.",
  components: [
    { id: "ui", name: "UI", type: "frontend", description: "The chat interface.", trustLevel: "untrusted" as const },
    { id: "api", name: "API", type: "api", description: "The backend API.", trustLevel: "trusted" as const },
  ],
  dataFlows: [{ id: "f1", from: "ui", to: "api", data: "User prompt", crossesTrustBoundary: true }],
  trustBoundaries: [{ id: "b1", name: "Internet", description: "Users are untrusted.", componentIds: ["ui"] }],
  entryPoints: [
    { id: "e1", name: "Prompt", componentId: "api", source: "User text", description: "Free-text prompt." },
  ],
  threats: [
    {
      id: "T1",
      componentId: "api",
      stride: "Tampering" as const,
      title: "Prompt injection",
      description: "The user tries to override instructions.",
      severity: "high" as const,
      owasp: [{ id: "LLM01" as const }],
      mitigation: "Isolate untrusted text from system instructions.",
    },
  ],
};

describe("threat model schema", () => {
  it("accepts a well-formed threat model", () => {
    const parsed = threatModelSchema.parse(validModel);
    expect(parsed.components).toHaveLength(2);
    expect(parsed.threats[0]?.owasp[0]?.id).toBe("LLM01");
  });

  it("rejects empty collections, invalid severity and unknown OWASP IDs", () => {
    expect(threatModelSchema.safeParse({ ...validModel, components: [] }).success).toBe(false);
    expect(threatModelSchema.safeParse({ ...validModel, threats: [] }).success).toBe(false);
    expect(
      threatModelSchema.safeParse({
        ...validModel,
        threats: [{ ...validModel.threats[0], severity: "urgent" }],
      }).success,
    ).toBe(false);
    expect(owaspIdSchema.safeParse("LLM11").success).toBe(false);
    expect(
      threatModelSchema.safeParse({
        ...validModel,
        threats: [{ ...validModel.threats[0], owasp: [] }],
      }).success,
    ).toBe(false);
  });

  it("validates all three committed example reports", () => {
    const ids = ["rag-chatbot", "coding-agent", "support-bot"];
    for (const id of ids) {
      const parsed = threatModelSchema.safeParse(exampleResults[id]);
      expect(parsed.success, id).toBe(true);
    }
    expect(Object.keys(exampleResults)).toHaveLength(3);
  });
});

describe("validateInput and parseFeatures", () => {
  const description = "A customer-support bot that answers from a knowledge base and can open tickets.";

  it("accepts a valid description and normalises feature flags", () => {
    const result = validateInput({ description, features: { usesRag: true, extra: true } });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.features.usesRag).toBe(true);
      expect(result.features.hasTools).toBe(false);
    }
    expect(parseFeatures(undefined).browsesTheWeb).toBe(false);
    expect(parseFeatures({ hasTools: "yes" }).hasTools).toBe(false);
  });

  it("rejects missing, short or oversized descriptions", () => {
    expect(validateInput({ description: "   " }).ok).toBe(false);
    expect(validateInput({ description: 12 }).ok).toBe(false);
    const short = validateInput({ description: "x".repeat(MIN_DESCRIPTION_CHARS - 1) });
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.status).toBe(400);
    const long = validateInput({ description: "y".repeat(MAX_DESCRIPTION_CHARS + 1) });
    expect(long.ok).toBe(false);
    if (!long.ok) expect(long.status).toBe(413);
  });
});
