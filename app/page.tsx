"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center bg-slate-950 text-sm text-slate-400">
      Loading editor...
    </div>
  ),
});

const refactorGoals = [
  "Improve Readability",
  "Reduce Complexity",
  "Make Idiomatic",
  "Optimize Performance",
];

const languages = [
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "Python", value: "python" },
  { label: "Rust", value: "rust" },
  { label: "Go", value: "go" },
];

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

export default function Home() {
  const [inputCode, setInputCode] = useState(starterCode);
  const [outputCode, setOutputCode] = useState(starterOutput);
  const [explanation, setExplanation] = useState(
    "- Replaced imperative looping with a declarative filter call.\n- Removed unnecessary boolean comparison.\n- Preserved the original behavior while making the intent easier to scan."
  );
  const [refactorGoal, setRefactorGoal] = useState(refactorGoals[0]);
  const [language, setLanguage] = useState(languages[0].value);
  const [customContext, setCustomContext] = useState(
    "Use modern language features while keeping the public API unchanged."
  );
  const [isLoading, setIsLoading] = useState(false);

  const selectedLanguageLabel = useMemo(
    () => languages.find((item) => item.value === language)?.label ?? "Code",
    [language]
  );

  const handleRefactor = () => {
    setIsLoading(true);

    window.setTimeout(() => {
      setOutputCode(inputCode.trim() || starterOutput);
      setExplanation(
        `- Goal: ${refactorGoal}.\n- Language target: ${selectedLanguageLabel}.\n- Context applied: ${customContext || "No additional context provided."}\n- AI execution is ready to be connected to the backend refactoring service.`
      );
      setIsLoading(false);
    }, 450);
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
                Draft
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
                    <option key={goal} value={goal}>
                      {goal}
                    </option>
                  ))}
                </select>
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
                        onClick={() => setLanguage(item.value)}
                        className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                          isSelected
                            ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100 shadow-lg shadow-cyan-950/40"
                            : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
                        }`}
                      >
                        {item.label}
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

              <button
                type="button"
                onClick={handleRefactor}
                disabled={isLoading}
                className="w-full rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-950/40 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Refactoring..." : "Refactor Code"}
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
                  <CodeEditor
                    value={outputCode}
                    language={language}
                    readOnly
                  />
                </div>
              </div>

              <div className="min-h-[220px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="border-b border-white/10 px-5 py-4">
                  <h2 className="font-semibold text-white">Explanation</h2>
                  <p className="text-sm text-slate-400">
                    Markdown-friendly architectural notes.
                  </p>
                </div>
                <div className="prose prose-invert max-w-none px-5 py-4 text-sm leading-7 text-slate-300">
                  <pre className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950/70 p-4 font-sans text-sm leading-7 text-slate-300">
                    {explanation}
                  </pre>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
