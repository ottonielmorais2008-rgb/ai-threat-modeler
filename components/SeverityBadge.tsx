import type { Severity } from "../lib/schema";

const STYLES: Record<Severity, string> = {
  critical: "bg-[#ffe4e6] text-[#9f1239]",
  high: "bg-[#fde4e1] text-[#b42318]",
  medium: "bg-[#ffedd5] text-[#b45309]",
  low: "bg-[#dbeafe] text-[#1d4ed8]",
  info: "bg-[#e7e5e4] text-[#44403c]",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ${STYLES[severity]}`}>
      {severity}
    </span>
  );
}
