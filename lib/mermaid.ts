import type { ThreatModel } from "./schema";

export function mermaidId(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9_]/g, "_");
  const trimmed = cleaned.replace(/^_+/, "") || "node";
  return /^[A-Za-z]/.test(trimmed) ? trimmed : `n_${trimmed}`;
}

export function mermaidLabel(text: string, max = 48): string {
  const compact = text.replace(/\s+/g, " ").trim();
  const cut = compact.length > max ? `${compact.slice(0, max - 1)}…` : compact;
  return cut.replace(/"/g, "#quot;").replace(/[\[\]]/g, "");
}

function uniqueMermaidIds(ids: string[]): Map<string, string> {
  const used = new Set<string>();
  const map = new Map<string, string>();
  for (const id of ids) {
    let next = mermaidId(id);
    if (used.has(next)) {
      let n = 2;
      while (used.has(`${next}_${n}`)) n += 1;
      next = `${next}_${n}`;
    }
    used.add(next);
    map.set(id, next);
  }
  return map;
}

export function buildMermaid(model: ThreatModel): string {
  const componentIds = uniqueMermaidIds(model.components.map((c) => c.id));
  const boundaryIds = uniqueMermaidIds([
    ...model.trustBoundaries.map((b) => `b_${b.id}`),
    "b_ungrouped",
  ]);

  const assigned = new Set<string>();
  const lines: string[] = ["flowchart LR"];

  for (const boundary of model.trustBoundaries) {
    const bid = boundaryIds.get(`b_${boundary.id}`)!;
    lines.push(`  subgraph ${bid}["${mermaidLabel(boundary.name)}"]`);
    for (const componentId of boundary.componentIds) {
      const component = model.components.find((c) => c.id === componentId);
      if (!component || assigned.has(component.id)) continue;
      assigned.add(component.id);
      const cid = componentIds.get(component.id)!;
      lines.push(`    ${cid}["${mermaidLabel(component.name)}"]`);
    }
    lines.push("  end");
  }

  const leftover = model.components.filter((c) => !assigned.has(c.id));
  if (leftover.length > 0) {
    const bid = boundaryIds.get("b_ungrouped")!;
    lines.push(`  subgraph ${bid}["Other components"]`);
    for (const component of leftover) {
      const cid = componentIds.get(component.id)!;
      lines.push(`    ${cid}["${mermaidLabel(component.name)}"]`);
    }
    lines.push("  end");
  }

  const seenEdges = new Set<string>();
  for (const flow of model.dataFlows) {
    const from = componentIds.get(flow.from);
    const to = componentIds.get(flow.to);
    if (!from || !to) continue;
    const key = `${from}->${to}:${flow.data}`;
    if (seenEdges.has(key)) continue;
    seenEdges.add(key);
    lines.push(`  ${from} -->|"${mermaidLabel(flow.data, 36)}"| ${to}`);
  }

  return lines.join("\n");
}
