import { buildMermaid } from "./mermaid";
import { countBySeverity, formatOwasp, uniqueOwaspIds } from "./owasp";
import { FEATURE_LABELS, featureKeys, type Features, type ThreatModel } from "./schema";

function componentName(model: ThreatModel, id: string): string {
  return model.components.find((c) => c.id === id)?.name ?? id;
}

export function enabledFeatureLabels(features?: Features | null): string[] {
  if (!features) return [];
  return featureKeys.filter((key) => features[key]).map((key) => FEATURE_LABELS[key]);
}

export function toMarkdown(model: ThreatModel, options?: { features?: Features; modelName?: string }): string {
  const counts = countBySeverity(model.threats);
  const features = enabledFeatureLabels(options?.features);
  const sections: string[] = [];

  sections.push(`# ${model.title}`, "", model.summary, "");

  if (options?.modelName) {
    sections.push(`_Generated with ${options.modelName}. This is an assistant, not a replacement for a security review._`, "");
  }

  if (features.length > 0) {
    sections.push("## Declared features", "", ...features.map((label) => `- ${label}`), "");
  }

  sections.push(
    "## Severity summary",
    "",
    `| Critical | High | Medium | Low | Info | Total |`,
    `| --- | --- | --- | --- | --- | --- |`,
    `| ${counts.critical} | ${counts.high} | ${counts.medium} | ${counts.low} | ${counts.info} | ${model.threats.length} |`,
    "",
  );

  sections.push("## Components", "");
  for (const component of model.components) {
    sections.push(
      `- **${component.name}** (\`${component.id}\`, ${component.type}, ${component.trustLevel}) — ${component.description}`,
    );
  }
  sections.push("");

  sections.push("## Trust boundaries", "");
  for (const boundary of model.trustBoundaries) {
    const names = boundary.componentIds.map((id) => componentName(model, id)).join(", ");
    sections.push(`- **${boundary.name}** — ${boundary.description} Components: ${names}.`);
  }
  sections.push("");

  sections.push("## Untrusted entry points", "");
  sections.push("Places where untrusted text can enter the system:", "");
  for (const entry of model.entryPoints) {
    sections.push(
      `- **${entry.name}** (via ${componentName(model, entry.componentId)}; source: ${entry.source}) — ${entry.description}`,
    );
  }
  sections.push("");

  sections.push("## Data flows", "");
  for (const flow of model.dataFlows) {
    const crossing = flow.crossesTrustBoundary ? " (crosses a trust boundary)" : "";
    sections.push(
      `- ${componentName(model, flow.from)} → ${componentName(model, flow.to)}: ${flow.data}${crossing}`,
    );
  }
  sections.push("");

  sections.push("## Data-flow diagram", "", "```mermaid", buildMermaid(model), "```", "");

  sections.push("## Threats (STRIDE)", "");
  for (const threat of model.threats) {
    const owasp = threat.owasp.map((ref) => formatOwasp(ref)).join("; ");
    sections.push(
      `### ${threat.id}: ${threat.title}`,
      "",
      `- **Component:** ${componentName(model, threat.componentId)}`,
      `- **STRIDE:** ${threat.stride}`,
      `- **Severity:** ${threat.severity}`,
      `- **OWASP:** ${owasp}`,
      `- **Description:** ${threat.description}`,
      `- **Mitigation:** ${threat.mitigation}`,
      "",
    );
  }

  const owaspCovered = uniqueOwaspIds(model.threats);
  if (owaspCovered.length > 0) {
    sections.push("## OWASP Top 10 for LLM Applications (2025) coverage", "");
    for (const id of owaspCovered) {
      sections.push(`- ${formatOwasp(id)}`);
    }
    sections.push("");
  }

  sections.push(
    "---",
    "",
    "This report is a starting point for discussion. It is not a complete security review and does not guarantee that every risk has been identified.",
    "",
  );

  return sections.join("\n");
}
