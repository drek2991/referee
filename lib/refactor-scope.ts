export const SUPPORTED_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isSupportedLanguage(
  language: string
): language is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some((item) => item === language);
}

const languageOptions = [
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "Python", value: "python" },
  { label: "Rust", value: "rust" },
  { label: "Go", value: "go" },
] as const;

export const languages = languageOptions.map((language) => ({
  ...language,
  enabled: isSupportedLanguage(language.value),
}));
