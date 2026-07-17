export const SUPPORTED_LANGUAGE = "javascript";
export const SUPPORTED_GOAL = "Improve Readability";

export const refactorGoals = [
  { label: "Improve Readability", value: SUPPORTED_GOAL, enabled: true },
  { label: "Reduce Complexity", value: "Reduce Complexity", enabled: false },
  { label: "Make Idiomatic", value: "Make Idiomatic", enabled: false },
  { label: "Optimize Performance", value: "Optimize Performance", enabled: false },
] as const;

export const languages = [
  { label: "JavaScript", value: SUPPORTED_LANGUAGE, enabled: true },
  { label: "TypeScript", value: "typescript", enabled: false },
  { label: "Python", value: "python", enabled: false },
  { label: "Rust", value: "rust", enabled: false },
  { label: "Go", value: "go", enabled: false },
] as const;
