import { languages } from "@/lib/refactor-scope";

const fenceLanguageAliases: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  golang: "go",
};

export function normalizeFenceLanguage(fenceLanguage: string) {
  const normalized = fenceLanguage.trim().toLowerCase();

  return fenceLanguageAliases[normalized] ?? normalized;
}

export function getLanguageMismatchHint(
  selectedLanguage: string,
  fenceLanguage: string
) {
  const normalizedFenceLanguage = normalizeFenceLanguage(fenceLanguage);

  if (!normalizedFenceLanguage || normalizedFenceLanguage === selectedLanguage) {
    return "";
  }

  const detectedLanguage = languages.find(
    (item) => item.value === normalizedFenceLanguage
  );

  if (!detectedLanguage) {
    return "The generated code uses an unexpected language tag. Review the output before using it.";
  }

  if (detectedLanguage.enabled) {
    return `This response looks like ${detectedLanguage.label}. Were you trying to refactor ${detectedLanguage.label} instead?`;
  }

  return `This response looks like ${detectedLanguage.label}. ${detectedLanguage.label} support is coming soon.`;
}
