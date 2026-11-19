# AI Threat Modeler

Describe an AI application and generate a structured threat model: components and data flows, trust boundaries, every place untrusted text can enter the system, STRIDE threats with severity, a mapping to the [OWASP Top 10 for LLM Applications (2025)](https://genai.owasp.org/llm-top-10/), and concrete mitigations.

**Live demo:** [https://ai-threat-modeler.vercel.app](https://ai-threat-modeler.vercel.app)

You can also start from a ready example (RAG chatbot, coding agent, or customer-support bot). Each example includes a sample report in the repository, so the demo stays usable if the model is unavailable.

This is an assistant to help you start a threat model. It is not a replacement for a professional security review.

## How it works

1. You describe the application in free text and, optionally, mark whether it uses RAG, has tools or agents, accepts file uploads, has user accounts, or browses the web.
2. The app calls a Gemini model through the AI SDK and validates the result against a Zod schema.
3. The report is rendered in the browser, including a Mermaid data-flow diagram grouped by trust boundary.
4. You can export the same report as Markdown.

Nothing is stored. The description is sent only to produce the report and is not saved by this application. The model API key is kept as an environment variable on the host and is not exposed to the browser.

## Sample output

A generated report includes a severity summary, entry points, and threats such as:

```text
T2  Critical  Tampering
Indirect prompt injection via uploaded files
OWASP: LLM01:2025 Prompt Injection; LLM04:2025 Data and Model Poisoning

Hidden instructions in a PDF can be retrieved later and alter the
assistant's behaviour for other users who ask related questions.

Mitigation: Strip or isolate active content on ingest, scan chunks
for instruction-like language, and require review before documents
become broadly retrievable.
```

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [AI SDK](https://ai-sdk.dev) (`generateText` with `Output.object`) and [Zod](https://zod.dev)
- [Google Gemini API](https://ai.google.dev) via `@ai-sdk/google` (`gemini-3.5-flash-lite` by default)
- [Mermaid](https://mermaid.js.org) for the client-side data-flow diagram
- [Vitest](https://vitest.dev) for unit tests
- Deployed on [Vercel](https://vercel.com)

## Tests and CI

`npm test` runs unit tests for schema validation, input checks, OWASP mapping helpers, Markdown export, Mermaid generation, the rate limiter, and the API route with a mocked model. The three sample reports are also checked against the schema. GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the type check, the tests and the production build. The CI job does not need an API key.

## API

`POST /api/generate` with:

```json
{
  "description": "A support bot that answers from a knowledge base and can open tickets for a signed-in customer.",
  "features": {
    "usesRag": true,
    "hasTools": true,
    "acceptsFileUploads": false,
    "hasUserAccounts": true,
    "browsesTheWeb": false
  }
}
```

returns `{ "threatModel": { ... }, "model": "gemini-3.5-flash-lite", "source": "model" }`.

Limits: description 6,000 characters (at least 40). The route also rejects oversized bodies and rate-limits repeated requests from the same IP.

## Limitations

- The model can miss assets, invent mild architectural detail, or under- or over-rate severity. Treat the output as a starting point.
- The sample reports are curated illustrations, not a complete review of a real production system.
- There is no persistent workspace: refresh the page and the current report is gone.
- A live generation needs a configured Gemini API key on the server.

## Run locally

Requires Node.js 22+. Clone the repository, run `npm install`, and create a `.env.local` file (never commit it) with:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

Then run `npm run dev` and open [http://localhost:3000](http://localhost:3000). Use `npm test` for the unit tests. You can change the model with `GOOGLE_MODEL`.

## License

[MIT](LICENSE)
