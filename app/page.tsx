"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import MarkdownPreview from "@/components/MarkdownPreview";
import { languages } from "@/lib/refactor-scope";
import {
  extractDeltaContent,
  splitRefactorResponse,
} from "@/lib/refactor-stream";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center bg-slate-950 text-sm text-slate-500">
      Loading Monaco editor...
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

export default function Home() {
  const [inputCode, setInputCode] = useState(starterCode);
  const [outputCode, setOutputCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [language, setLanguage] = useState<string>(languages[0].value);
  const [refactorRequest, setRefactorRequest] = useState(
    "Make this easier to read without changing behavior."
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedLanguageLabel = useMemo(
    () => languages.find((item) => item.value === language)?.label ?? "Code",
    [language]
  );
  const availableLanguages = languages.filter((item) => item.enabled);
  const upcomingLanguages = languages.filter((item) => !item.enabled);
  const workspaceStatus = errorMessage
    ? "Needs attention"
    : isLoading
      ? "Streaming"
      : outputCode
        ? "Review ready"
        : "Ready";

  const handleRefactor = async () => {
    const selectedLanguage = languages.find((item) => item.value === language);

    if (!selectedLanguage?.enabled) {
      setErrorMessage("Select an available language.");
      return;
    }

    if (!inputCode.trim()) {
      setErrorMessage("Paste code before starting a refactor.");
      return;
    }

    if (!refactorRequest.trim()) {
      setErrorMessage("Describe what Referee should improve.");
      return;
    }

    setIsLoading(true);
    setHasSubmitted(true);
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
          refactorRequest: refactorRequest.trim(),
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
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.07),transparent_24%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(148,163,184,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.5)_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1800px] flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <header className="border-b border-white/10 pb-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 font-mono text-sm font-bold text-cyan-200 shadow-lg shadow-cyan-950/30">
                R/
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-tight text-white">
                  Referee
                </p>
                <p className="truncate text-xs text-slate-500">
                  Behavior-preserving refactoring workspace
                </p>
              </div>
            </div>
            <div
              role="status"
              aria-live="polite"
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                errorMessage
                  ? "border-red-400/25 bg-red-400/10 text-red-200"
                  : isLoading
                    ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                    : outputCode
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/[0.04] text-slate-300"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${
                  errorMessage
                    ? "bg-red-300"
                    : isLoading
                      ? "animate-pulse bg-cyan-200"
                      : outputCode
                        ? "bg-emerald-300"
                        : "bg-slate-500"
                }`}
              />
              {workspaceStatus}
            </div>
          </div>

          <div className="mt-6 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
              AI refactoring workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Refactor with intent. Preserve behavior.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Describe the improvement you want, then review a focused plan and
              generated code side by side.
            </p>
          </div>
        </header>

        <div className="grid flex-1 gap-5 py-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="min-w-0 xl:sticky xl:top-5 xl:self-start">
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/85 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
                      Refactor request
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-white">
                      What should improve?
                    </h2>
                  </div>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Required
                  </span>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <label
                    htmlFor="refactor-request"
                    className="text-sm font-medium text-slate-200"
                  >
                    Refactor instructions
                  </label>
                  <textarea
                    id="refactor-request"
                    value={refactorRequest}
                    onChange={(event) => {
                      setRefactorRequest(event.target.value);
                      if (
                        errorMessage ===
                        "Describe what Referee should improve."
                      ) {
                        setErrorMessage("");
                      }
                    }}
                    aria-describedby="refactor-request-help"
                    aria-invalid={
                      errorMessage === "Describe what Referee should improve."
                    }
                    placeholder="Reduce duplication and clarify the structure."
                    rows={7}
                    className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 hover:border-white/15 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10"
                  />
                  <p
                    id="refactor-request-help"
                    className="mt-2 text-xs leading-5 text-slate-500"
                  >
                    Ask for clearer structure, less duplication, or safer
                    efficiency. Referee keeps external behavior unchanged.
                  </p>
                </div>

                <fieldset>
                  <legend className="text-sm font-medium text-slate-200">
                    Language
                  </legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {availableLanguages.map((item) => {
                      const isSelected = item.value === language;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          disabled={isLoading}
                          onClick={() => setLanguage(item.value)}
                          aria-pressed={isSelected}
                          className={`min-h-11 rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-wait disabled:opacity-50 ${
                            isSelected
                              ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100 shadow-sm shadow-cyan-950/50"
                              : "border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            {item.label}
                            {isSelected ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-slate-950/35 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Coming soon
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {upcomingLanguages.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          disabled
                          aria-label={`${item.label} — Coming soon`}
                          className="cursor-not-allowed rounded-lg border border-white/5 bg-white/[0.025] px-2.5 py-1.5 text-xs font-medium text-slate-500"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </fieldset>

                {errorMessage ? (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3.5 py-3 text-sm leading-5 text-red-100"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-400/15 text-xs font-bold text-red-200">
                      !
                    </span>
                    <span>{errorMessage}</span>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleRefactor}
                  disabled={isLoading}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/30 outline-none transition hover:bg-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-wait disabled:bg-cyan-300/70"
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                      Streaming refactor
                    </>
                  ) : (
                    <>
                      Run refactor
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] leading-4 text-slate-600">
                  Referee proposes changes for review. It does not execute code.
                </p>
              </div>
            </section>
          </aside>

          <section className="grid min-w-0 content-start gap-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/55 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Review workspace
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-200">
                  {selectedLanguageLabel} · input, output, and plan
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
                <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
                  Monaco
                </span>
                <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
                  Read-only output
                </span>
                <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
                  Streaming
                </span>
              </div>
            </div>

            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              <article className="flex min-h-[460px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/85 shadow-xl shadow-black/15">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-950 font-mono text-xs text-slate-400">
                      IN
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-white">
                        Source code
                      </h2>
                      <p className="truncate text-xs text-slate-500">
                        Original implementation
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    Editable
                  </span>
                </div>
                <div className="min-h-0 flex-1">
                  <CodeEditor
                    value={inputCode}
                    language={language}
                    onChange={setInputCode}
                    ariaLabel="Input code editor"
                  />
                </div>
              </article>

              <article className="flex min-h-[460px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/85 shadow-xl shadow-black/15">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-950 font-mono text-xs text-slate-400">
                      OUT
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-white">
                        Refactored code
                      </h2>
                      <p className="truncate text-xs text-slate-500">
                        Generated implementation
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-amber-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                    Read only
                  </span>
                </div>
                <div className="relative min-h-0 flex-1">
                  <CodeEditor
                    value={outputCode}
                    language={language}
                    readOnly
                    ariaLabel="Refactored code editor"
                  />
                  {!outputCode ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/92 p-6 text-center">
                      <div className="max-w-xs">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] font-mono text-sm text-slate-500">
                          {isLoading ? "…" : "{}"}
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-300">
                          {isLoading
                            ? "Waiting for generated code"
                            : "Your refactored code will appear here"}
                        </p>
                        <p className="mt-1.5 text-xs leading-5 text-slate-600">
                          {isLoading
                            ? "The output editor will update when the stream reaches the code block."
                            : "Submit a focused request to generate a behavior-preserving implementation."}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            </div>

            <article className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/85 shadow-xl shadow-black/15">
              <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-300/15 bg-violet-300/10 font-mono text-xs text-violet-200">
                    {"//"}
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Refactor plan &amp; notes
                    </h2>
                    <p className="text-xs text-slate-500">
                      Proposed actions and behavior-preservation guidance
                    </p>
                  </div>
                </div>
                {explanation ? (
                  <span className="self-start rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:self-auto">
                    Markdown
                  </span>
                ) : null}
              </div>
              <div className="max-h-[340px] min-h-[180px] overflow-y-auto px-5 py-5">
                {explanation ? (
                  <MarkdownPreview content={explanation} />
                ) : (
                  <div className="flex min-h-[140px] items-center justify-center text-center">
                    <div className="max-w-md">
                      <p className="text-sm font-medium text-slate-300">
                        {errorMessage && hasSubmitted
                          ? "The plan could not be generated"
                          : "A focused plan will appear here"}
                      </p>
                      <p className="mt-1.5 text-xs leading-5 text-slate-600">
                        {errorMessage && hasSubmitted
                          ? "Review the request error, then try the refactor again."
                          : "Referee explains the structural changes before presenting the generated code."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
