"use client";

import { useEffect, useId, useState } from "react";

export function MermaidDiagram({ chart }: { chart: string }) {
  const rawId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSvg("");
    setError(null);

    void (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "strict",
          themeVariables: {
            primaryColor: "#e4eef0",
            primaryTextColor: "#1c1917",
            primaryBorderColor: "#1f4e5a",
            lineColor: "#57534e",
            secondaryColor: "#f3f1ec",
            tertiaryColor: "#ffffff",
            fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif",
          },
          flowchart: { curve: "basis", htmlLabels: false, padding: 12 },
        });
        const id = `mmd_${rawId}_${Math.random().toString(36).slice(2, 8)}`;
        const rendered = await mermaid.render(id, chart);
        if (!cancelled) setSvg(rendered.svg);
      } catch {
        if (!cancelled) setError("Could not render the diagram. The Mermaid source is shown below.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, rawId]);

  if (error) {
    return (
      <div>
        <p className="mb-2 text-sm text-[#b42318]">{error}</p>
        <pre className="overflow-x-auto rounded-lg border border-[#ddd6cb] bg-white p-3 text-xs">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return <p className="text-sm text-[#57534e]">Rendering diagram…</p>;
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border border-[#ddd6cb] bg-white p-3 [&_svg]:mx-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
