import type { ExampleResult } from "./example-types";
import type { Features } from "./schema";

export type Example = {
  id: string;
  title: string;
  blurb: string;
  description: string;
  features: Features;
};

export const examples: Example[] = [
  {
    id: "rag-chatbot",
    title: "RAG chatbot",
    blurb: "Signed-in employees ask a knowledge assistant that retrieves company documents.",
    description:
      "An internal knowledge assistant for employees. Users sign in and ask questions in a web chat. " +
      "The app embeds each question, retrieves passages from a vector store of company policies, wikis and uploaded PDFs, " +
      "and sends the retrieved chunks plus the question to a hosted LLM. Users can upload new documents that are parsed, " +
      "chunked and embedded. Answers may include citations. Administrators can re-index the corpus. " +
      "The assistant must not reveal documents the employee is not allowed to read.",
    features: {
      usesRag: true,
      hasTools: false,
      acceptsFileUploads: true,
      hasUserAccounts: true,
      browsesTheWeb: false,
    },
  },
  {
    id: "coding-agent",
    title: "Coding agent",
    blurb: "An agent that reads a repo, runs tools, and can browse docs on the public web.",
    description:
      "A coding agent that helps a developer change a connected source-code repository. " +
      "The developer describes a task in natural language. The agent can list and read files, apply patches, " +
      "run tests in a sandbox, and search the public web for library documentation. " +
      "It also has a tool that can open a pull request. Access to the repository is granted with a short-lived token. " +
      "The agent may receive file attachments such as logs or stack traces. There are no long-term user accounts.",
    features: {
      usesRag: false,
      hasTools: true,
      acceptsFileUploads: true,
      hasUserAccounts: false,
      browsesTheWeb: true,
    },
  },
  {
    id: "support-bot",
    title: "Customer-support bot",
    blurb: "A help-centre bot that answers from a knowledge base and can act on a customer's tickets.",
    description:
      "A customer-support bot available on a public help site and inside a logged-in account portal. " +
      "It answers product questions from a curated knowledge base using retrieval-augmented generation. " +
      "When a customer is signed in, the bot can look up that customer's orders and can open or update support tickets through tools. " +
      "It must never access another customer's data. Conversation transcripts are stored for quality review. " +
      "Replies are shown in the web widget and may be emailed to the customer.",
    features: {
      usesRag: true,
      hasTools: true,
      acceptsFileUploads: false,
      hasUserAccounts: true,
      browsesTheWeb: false,
    },
  },
];

export function getExample(id: string): Example | undefined {
  return examples.find((example) => example.id === id);
}

export type { ExampleResult };
