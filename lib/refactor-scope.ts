export const SUPPORTED_LANGUAGE = "javascript";

export const languages = [
  { label: "JavaScript", value: SUPPORTED_LANGUAGE, enabled: true },
  { label: "TypeScript", value: "typescript", enabled: false },
  { label: "Python", value: "python", enabled: false },
  { label: "Rust", value: "rust", enabled: false },
  { label: "Go", value: "go", enabled: false },
] as const;
