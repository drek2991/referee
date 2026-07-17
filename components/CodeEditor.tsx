"use client";

import Editor from "@monaco-editor/react";

type CodeEditorProps = {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  ariaLabel?: string;
};

export default function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  height = "100%",
  ariaLabel,
}: CodeEditorProps) {
  return (
    <Editor
      height={height}
      language={language}
      theme="vs-dark"
      value={value}
      onChange={(nextValue) => onChange?.(nextValue ?? "")}
      options={{
        ariaLabel: ariaLabel ?? (readOnly ? "Refactored code editor" : "Input code editor"),
        automaticLayout: true,
        cursorBlinking: readOnly ? "solid" : "blink",
        fontFamily:
          '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
        fontLigatures: true,
        fontSize: 14,
        lineHeight: 22,
        minimap: { enabled: false },
        padding: { top: 16, bottom: 16 },
        readOnly,
        renderLineHighlight: readOnly ? "none" : "line",
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        tabSize: 2,
        wordWrap: "on",
      }}
    />
  );
}
