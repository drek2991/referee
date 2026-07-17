"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { languages, refactorGoals } from "@/lib/refactor-scope";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center bg-slate-950 text-sm text-slate-400">
      Loading editor...
    </div>
  ),
});

const starterCode = `function getActiveUsers(users) {
  var result = [];
  for (var i = 0; i < users.length; i++) {
    if (users[i].active === true) {
      result.push(users[i]);
    }
  }
  return result;
}`;

const starterOutput = `const getActiveUsers = (users) =>
  users.filter((user) => user.active);`;

const starterExplanation =
  "- Replaced imperative looping with a declarative filter call.\n- Removed unnecessary boolean comparison.\n- Preserved the original behavior while making the intent easier to scan.";

type StreamDelta = {
  choices?: Array<{
    delta?: {
      content?: unknown;
    };
  }>;
};

function splitRefactorResponse(content: string) {
  const openingFenceIndex = content.indexOf("```");

  if (openingFenceIndex === -1) {
    return {
      explanation: content.trimStart(),
      code: "",
    };
  }

  const explanation = content.slice(0, openingFenceIndex).trim();
  const afterOpeningFence = content.slice(openingFenceIndex + 3);
  const openingLineMatch = afterOpeningFence.match(/^[^\r\n]*(?:\r?\n)?/);
  const openingLine = openingLineMatch?.[0] ?? "";
  const codeBlockBody = afterOpeningFence.slice(openingLine.length);
  const closingFenceIndex = codeBlockBody.indexOf("```");
  const code =
    closingFenceIndex === -1
      ? codeBlockBody
      : codeBlockBody.slice(0, closingFenceIndex).trimEnd();

  return {
    explanation,
    code,
  };
}

function extractDeltaContent(payload: unknown) {
  const streamDelta = payload as StreamDelta;
  const content = streamDelta.choices?.[0]?.delta?.content;

  return typeof content === "string" ? content : "";
}

function renderInlineMarkdown(text: string) {
  const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return segments.map((segment, index) => {
    if (segment.startsWith("`") && segment.endsWith("`") && segment.length > 1) {
      return (
        <code
          key={`${segment}-${index}`}
          className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.9em] text-cyan-100"
        >
          {segment.slice(1, -1)}
        </code>
      );
    }

    if (
      segment.startsWith("**") &&
      segment.endsWith("**") &&
      segment.length > 3
    ) {
      return (
        <strong key={`${segment}-${index}`} className="font-semibold text-white">
          {segment.slice(2, -2)}
        </strong>
      );
    }

    return segment;
  });
}

function MarkdownPreview({ content }: { content: string }) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return (
      <p className="text-sm leading-7 text-slate-500">
        The streamed explanation will appear here.
      </p>
    );
  }

  const lines = trimmedContent.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let bulletItems: string[] = [];

  const flushBulletItems = () => {
    if (bulletItems.length === 0) {
      return;
    }

    elements.push(
      <ul
        key={`list-${elements.length}`}
        className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-300"
      >
        {bulletItems.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  lines.forEach((line) => {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);

    if (bulletMatch) {
      bulletItems.push(bulletMatch[1]);
      return;
    }

    flushBulletItems();

    if (headingMatch) {
      elements.push(
        <h3
          key={`heading-${elements.length}`}
          className="text-base font-semibold text-white"
        >
          {renderInlineMarkdown(headingMatch[2])}
        </h3>
      );
      return;
    }

    if (line.trim().length === 0) {
      elements.push(<div key={`space-${elements.length}`} className="h-2" />);
      return;
    }

    elements.push(
      <p key={`paragraph-${elements.length}`} className="text-sm leading-7">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushBulletItems();

  return <div className="space-y-3 text-slate-300">{elements}</div>;
}

export default function Home() {
  const [inputCode, setInputCode] = useState(starterCode);
  const [outputCode, setOutputCode] = useState(starterOutput);
  const [explanation, setExplanation] = useState(starterExplanation);
  const [refactorGoal, setRefactorGoal] = useState<string>(refactorGoals[0].value);
  const [language, setLanguage] = useState<string>(languages[0].value);
  const [customContext, setCustomContext] = useState(
    "Use modern language features while keeping the public API unchanged."
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedLanguageLabel = useMemo(
    () => languages.find((item) => item.value === language)?.label ?? "Code",
    [language]
  );

  const handleRefactor = async () => {
    const selectedLanguage = languages.find((item) => item.value === language);
    const selectedGoal = refactorGoals.find((item) => item.value === refactorGoal);

    if (!selectedLanguage?.enabled || !selectedGoal?.enabled) {
      setErrorMessage("Select an available language and refactoring goal.");
      return;
    }

    if (!inputCode.trim()) {
      setErrorMessage("Paste code before starting a refactor.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setOutputCode("");
    setExplanation("Waiting for the model to start streaming...");

    try {
      const response = await fetch("/api/refactor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: inputCode,
          language,
          goal: refactorGoal,
          customContext,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(
          errorBody?.error ?? "Unable to start the refactoring stream."
        );
      }

      if (!response.body) {
        throw new Error("The refactoring response did not include a stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let lineBuffer = "";
      let accumulatedText = "";

      const applyDelta = (delta: string) => {
        accumulatedText += delta;
        const parsed = splitRefactorResponse(accumulatedText);

        setExplanation(parsed.explanation);
        setOutputCode(parsed.code);
      };

      const processLine = (line: string) => {
        const trimmedLine = line.trim();

        if (!trimmedLine.startsWith("data:")) {
          return;
        }

        const data = trimmedLine.slice(5).trim();

        if (!data || data === "[DONE]") {
          return;
        }

        try {
          const payload = JSON.parse(data) as unknown;
          const content = extractDeltaContent(payload);

          if (content) {
            applyDelta(content);
          }
        } catch {
          throw new Error("Received an invalid streaming response chunk.");
        }
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split(/\r?\n/);
        lineBuffer = lines.pop() ?? "";
        lines.forEach(processLine);
      }

      lineBuffer += decoder.decode();

      if (lineBuffer.trim()) {
        processLine(lineBuffer);
      }

      const parsed = splitRefactorResponse(accumulatedText);
      setExplanation(parsed.explanation || "No explanation was returned.");
      setOutputCode(parsed.code || accumulatedText);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while streaming the refactor."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0),rgba(15,23,42,0.92))]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1800px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 backdrop-blur md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
              Referee Workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              AI refactoring cockpit
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
              Paste code, select an intent, and review the refactored output with
              a structured architectural explanation.
            </p>
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">
            Monaco ready · {selectedLanguageLabel}
          </div>
        </header>

        <section className="grid flex-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/30 backdrop-blur xl:min-h-[760px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Controls</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Tune the refactoring request.
                </p>
              </div>
              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                {isLoading ? "Streaming" : "Draft"}
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-slate-200">
                  Refactoring goal
                </span>
                <select
                  value={refactorGoal}
                  onChange={(event) => setRefactorGoal(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10"
                >
                  {refactorGoals.map((goal) => (
                    <option
                      key={goal.value}
                      value={goal.value}
                      disabled={!goal.enabled}
                    >
                      {goal.label}
                      {goal.enabled ? "" : " — Coming soon"}
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-xs leading-5 text-slate-500">
                  More refactoring goals are coming soon.
                </span>
              </label>

              <div>
                <span className="text-sm font-medium text-slate-200">
                  Target language
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
                  {languages.map((item) => {
                    const isSelected = item.value === language;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        disabled={!item.enabled}
                        onClick={() => setLanguage(item.value)}
                        aria-label={`${item.label}${item.enabled ? "" : " — Coming soon"}`}
                        className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                          isSelected
                            ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100 shadow-lg shadow-cyan-950/40"
                            : item.enabled
                              ? "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
                              : "cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-600"
                        }`}
                      >
                        <span className="block">{item.label}</span>
                        {!item.enabled ? (
                          <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-wide text-slate-600">
                            Coming soon
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-slate-200">
                  Custom context or instructions
                </span>
                <textarea
                  value={customContext}
                  onChange={(event) => setCustomContext(event.target.value)}
                  placeholder="Use async/await instead of promises"
                  rows={7}
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10"
                />
              </label>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleRefactor}
                disabled={isLoading}
                className="w-full rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-950/40 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Streaming Refactor..." : "Refactor Code"}
              </button>
            </div>
          </aside>

          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            <section className="flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-white">Input Code</h2>
                  <p className="text-sm text-slate-400">
                    Edit the original implementation.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                  Editable
                </span>
              </div>
              <div className="min-h-0 flex-1">
                <CodeEditor
                  value={inputCode}
                  language={language}
                  onChange={setInputCode}
                />
              </div>
            </section>

            <section className="grid min-h-[760px] min-w-0 gap-5 lg:min-h-0 lg:grid-rows-[minmax(360px,1fr)_minmax(220px,0.62fr)]">
              <div className="flex min-h-[360px] min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                  <div>
                    <h2 className="font-semibold text-white">Refactored Code</h2>
                    <p className="text-sm text-slate-400">
                      Read-only generated output.
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-100">
                    Locked
                  </span>
                </div>
                <div className="min-h-0 flex-1">
                  <CodeEditor value={outputCode} language={language} readOnly />
                </div>
              </div>

              <div className="min-h-[220px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="border-b border-white/10 px-5 py-4">
                  <h2 className="font-semibold text-white">Explanation</h2>
                  <p className="text-sm text-slate-400">
                    Markdown-friendly architectural notes.
                  </p>
                </div>
                <div className="px-5 py-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <MarkdownPreview content={explanation} />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
