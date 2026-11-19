import { z } from "zod";

export const MAX_DESCRIPTION_CHARS = 6000;
export const MIN_DESCRIPTION_CHARS = 40;
export const MAX_BODY_BYTES = 20_000;

export const DEFAULT_MODEL = "gemini-3.5-flash-lite";

export const featureKeys = [
  "usesRag",
  "hasTools",
  "acceptsFileUploads",
  "hasUserAccounts",
  "browsesTheWeb",
] as const;
export type FeatureKey = (typeof featureKeys)[number];

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  usesRag: "Uses RAG / a document store",
  hasTools: "Has tools or agents",
  acceptsFileUploads: "Accepts file uploads",
  hasUserAccounts: "Has user accounts",
  browsesTheWeb: "Browses the web",
};

export const featuresSchema = z.object({
  usesRag: z.boolean(),
  hasTools: z.boolean(),
  acceptsFileUploads: z.boolean(),
  hasUserAccounts: z.boolean(),
  browsesTheWeb: z.boolean(),
});
export type Features = z.infer<typeof featuresSchema>;

export const emptyFeatures = (): Features => ({
  usesRag: false,
  hasTools: false,
  acceptsFileUploads: false,
  hasUserAccounts: false,
  browsesTheWeb: false,
});

export const severitySchema = z.enum(["critical", "high", "medium", "low", "info"]);
export type Severity = z.infer<typeof severitySchema>;

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export const strideSchema = z.enum([
  "Spoofing",
  "Tampering",
  "Repudiation",
  "Information Disclosure",
  "Denial of Service",
  "Elevation of Privilege",
]);
export type StrideCategory = z.infer<typeof strideSchema>;

export const owaspIdSchema = z.enum([
  "LLM01",
  "LLM02",
  "LLM03",
  "LLM04",
  "LLM05",
  "LLM06",
  "LLM07",
  "LLM08",
  "LLM09",
  "LLM10",
]);
export type OwaspId = z.infer<typeof owaspIdSchema>;

export const trustLevelSchema = z.enum(["untrusted", "semi-trusted", "trusted"]);
export type TrustLevel = z.infer<typeof trustLevelSchema>;

export const componentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
  trustLevel: trustLevelSchema,
});
export type Component = z.infer<typeof componentSchema>;

export const dataFlowSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  data: z.string().min(1),
  crossesTrustBoundary: z.boolean(),
});
export type DataFlow = z.infer<typeof dataFlowSchema>;

export const trustBoundarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  componentIds: z.array(z.string().min(1)).min(1),
});
export type TrustBoundary = z.infer<typeof trustBoundarySchema>;

export const entryPointSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  componentId: z.string().min(1),
  source: z.string().min(1),
  description: z.string().min(1),
});
export type EntryPoint = z.infer<typeof entryPointSchema>;

export const owaspRefSchema = z.object({
  id: owaspIdSchema,
  title: z.string().min(1).optional(),
});
export type OwaspRef = z.infer<typeof owaspRefSchema>;

export const threatSchema = z.object({
  id: z.string().min(1),
  componentId: z.string().min(1),
  stride: strideSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  severity: severitySchema,
  owasp: z.array(owaspRefSchema).min(1),
  mitigation: z.string().min(1),
});
export type Threat = z.infer<typeof threatSchema>;

export const threatModelSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  components: z.array(componentSchema).min(1),
  dataFlows: z.array(dataFlowSchema).min(1),
  trustBoundaries: z.array(trustBoundarySchema).min(1),
  entryPoints: z.array(entryPointSchema).min(1),
  threats: z.array(threatSchema).min(1),
});
export type ThreatModel = z.infer<typeof threatModelSchema>;

export const generateResponseSchema = z.object({
  threatModel: threatModelSchema,
  model: z.string().min(1),
  source: z.enum(["model", "example"]),
});
export type GenerateResponse = z.infer<typeof generateResponseSchema>;
