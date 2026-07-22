import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
};

const faqs = [
  {
    question: "What does SafeSetu scan for?",
    answer:
      "SafeSetu runs 11 security checks covering exposed secrets, missing row-level security, unauthenticated API routes, unverified webhooks, client-writable sensitive fields, committed .env files, CORS misconfigurations, XSS risks, SQL injection, insecure direct object references (IDOR), and insecure configuration patterns.",
  },
  {
    question: "How does scoring work?",
    answer:
      "Every repository starts at 100 points. Each finding deducts points based on severity: critical issues deduct 20, high deducts 15, medium deducts 10, and low deducts 5. A score of 80+ means 'Ship it', 50-79 means 'Fix first', and below 50 means 'Do not ship'.",
  },
  {
    question: "Is my code stored on your servers?",
    answer:
      "No. SafeSetu reads your code via the GitHub API during the scan and discards it immediately after analysis. Only the scan results (findings, scores) are stored in your account.",
  },
  {
    question: "Which frameworks are supported?",
    answer:
      "SafeSetu is optimized for Next.js, Supabase, and modern JavaScript/TypeScript apps — the most common stack for AI-built applications. Many rules also apply to other frameworks.",
  },
  {
    question: "Can I scan private repositories?",
    answer:
      "Yes. When you sign in with GitHub, SafeSetu requests the 'repo' scope which grants read access to your private repositories. Your token is only used to read code during scans.",
  },
  {
    question: "How do I delete my account and data?",
    answer:
      "Go to Settings from the user menu and click 'Delete Account'. This permanently removes your account, connected repositories, and all scan history.",
  },
  {
    question: "Is SafeSetu open source?",
    answer:
      "The scan engine and security rules are designed to be transparent. Check our GitHub repository for the source code.",
  },
  {
    question: "What AI model powers the scan enrichment?",
    answer:
      "SafeSetu uses an LLM to validate findings, reduce false positives, and generate plain-English fix prompts with code diffs. The LLM enrichment is optional — the core regex-based scanner works without it.",
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="text-4xl font-bold tracking-tight">
        Frequently Asked Questions
      </h1>
      <div className="mt-12 flex flex-col gap-8">
        {faqs.map(({ question, answer }) => (
          <div key={question}>
            <h2 className="text-lg font-semibold">{question}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
