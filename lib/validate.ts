import {
  emptyFeatures,
  featureKeys,
  MAX_DESCRIPTION_CHARS,
  MIN_DESCRIPTION_CHARS,
  type Features,
} from "./schema";

export type InputOk = { ok: true; description: string; features: Features };
export type InputErr = { ok: false; status: number; error: string };
export type InputCheck = InputOk | InputErr;

export function parseFeatures(raw: unknown): Features {
  const features = emptyFeatures();
  if (!raw || typeof raw !== "object") return features;
  const record = raw as Record<string, unknown>;
  for (const key of featureKeys) {
    if (typeof record[key] === "boolean") features[key] = record[key];
  }
  return features;
}

export function validateInput(body: { description?: unknown; features?: unknown }): InputCheck {
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!description) {
    return { ok: false, status: 400, error: "Describe the AI application you want to threat-model." };
  }
  if (description.length < MIN_DESCRIPTION_CHARS) {
    return {
      ok: false,
      status: 400,
      error: `The description needs at least ${MIN_DESCRIPTION_CHARS} characters.`,
    };
  }
  if (description.length > MAX_DESCRIPTION_CHARS) {
    return {
      ok: false,
      status: 413,
      error: `The description must be at most ${MAX_DESCRIPTION_CHARS} characters.`,
    };
  }

  return { ok: true, description, features: parseFeatures(body.features) };
}
