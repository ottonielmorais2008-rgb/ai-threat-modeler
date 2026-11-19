import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerateResponse } from "../lib/schema";

vi.mock("../lib/generate", () => ({
  runThreatModel: vi.fn(),
}));

import { runThreatModel } from "../lib/generate";
import { apiRateLimiter, getClientIp, RateLimiter } from "../lib/rate-limit";
import { POST } from "../app/api/generate/route";
import { exampleResults } from "../lib/example-results";

const runMock = vi.mocked(runThreatModel);

const description =
  "A retrieval-augmented chatbot for employees that searches a private document store and answers questions.";

const okResult: GenerateResponse = {
  threatModel: exampleResults["rag-chatbot"]!,
  model: "gemini-3.5-flash-lite",
  source: "model",
};

function makeRequest(body: unknown, init?: { ip?: string; contentLength?: string; raw?: string }): Request {
  const payload = init?.raw ?? JSON.stringify(body);
  const headers = new Headers({ "content-type": "application/json" });
  if (init?.ip) headers.set("x-forwarded-for", init.ip);
  if (init?.contentLength) headers.set("content-length", init.contentLength);
  return new Request("http://localhost/api/generate", { method: "POST", headers, body: payload });
}

async function read(res: Response): Promise<{ status: number; body: Record<string, unknown> }> {
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

describe("RateLimiter and getClientIp", () => {
  it("allows up to the max hits in a window and then blocks", () => {
    const limiter = new RateLimiter(1_000, 2);
    expect(limiter.allow("a", 0)).toBe(true);
    expect(limiter.allow("a", 10)).toBe(true);
    expect(limiter.allow("a", 20)).toBe(false);
    expect(limiter.allow("a", 1_010)).toBe(true);
  });

  it("reads the first forwarded IP and falls back to unknown", () => {
    const forwarded = new Request("http://localhost", {
      headers: { "x-forwarded-for": " 1.1.1.1, 2.2.2.2" },
    });
    expect(getClientIp(forwarded)).toBe("1.1.1.1");
    expect(getClientIp(new Request("http://localhost"))).toBe("unknown");
  });
});

describe("POST /api/generate", () => {
  beforeEach(() => {
    apiRateLimiter.reset();
    runMock.mockReset();
  });

  it("returns 400 for invalid JSON", async () => {
    const { status, body } = await read(await POST(makeRequest({}, { raw: "{not-json" })));
    expect(status).toBe(400);
    expect(body.error).toMatch(/json/i);
    expect(runMock).not.toHaveBeenCalled();
  });

  it("returns 400 for short input and 413 when over the size limits", async () => {
    const short = await read(await POST(makeRequest({ description: "too short" }, { ip: "10.0.0.1" })));
    expect(short.status).toBe(400);

    const oversized = await read(
      await POST(makeRequest({ description }, { ip: "10.0.0.2", contentLength: "20001" })),
    );
    expect(oversized.status).toBe(413);

    const long = await read(
      await POST(makeRequest({ description: "x".repeat(6001) }, { ip: "10.0.0.3" })),
    );
    expect(long.status).toBe(413);
    expect(runMock).not.toHaveBeenCalled();
  });

  it("returns the generated model from the helper", async () => {
    runMock.mockResolvedValue(okResult);
    const { status, body } = await read(
      await POST(makeRequest({ description, features: { usesRag: true } }, { ip: "10.0.0.4" })),
    );
    expect(status).toBe(200);
    expect(body.source).toBe("model");
    expect(body.model).toBe("gemini-3.5-flash-lite");
    const threatModel = body.threatModel as { title: string };
    expect(threatModel.title).toBe(okResult.threatModel.title);
    expect(runMock).toHaveBeenCalledOnce();
    const [passedDescription, passedFeatures] = runMock.mock.calls[0]!;
    expect(passedDescription).toBe(description);
    expect(passedFeatures).toMatchObject({ usesRag: true, hasTools: false });
  });

  it("returns 502 when the model fails", async () => {
    runMock.mockRejectedValue(new Error("model down"));
    const { status, body } = await read(await POST(makeRequest({ description }, { ip: "10.0.0.5" })));
    expect(status).toBe(502);
    expect(String(body.error)).toMatch(/could not be generated/i);
  });

  it("returns 429 after the per-IP request budget is used", async () => {
    runMock.mockResolvedValue(okResult);
    const ip = "203.0.113.9";
    for (let i = 0; i < 8; i++) {
      const res = await POST(makeRequest({ description }, { ip }));
      expect(res.status).toBe(200);
    }
    const blocked = await read(await POST(makeRequest({ description }, { ip })));
    expect(blocked.status).toBe(429);
    expect(runMock).toHaveBeenCalledTimes(8);
  });
});
