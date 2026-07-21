import type { RefactorResponseValidation } from "@/lib/refactor-stream";

export function getResponseFormatWarnings(
  validation: RefactorResponseValidation
) {
  const warnings: string[] = [];

  if (!validation.hasCodeBlock) {
    return [
      "The response did not include a fenced code block. No generated code was added to the output editor.",
    ];
  }

  if (!validation.hasClosingFence) {
    warnings.push(
      "The generated code block was not closed. Review the partial output before using it."
    );
  }

  if (validation.codeBlockCount > 1) {
    warnings.push(
      "The model returned multiple code blocks. Referee is showing the first code block only."
    );
  }

  if (validation.hasTrailingText) {
    warnings.push(
      "The response included unexpected text after the code block. That text was not added to the output editor."
    );
  }

  if (!validation.hasLanguageTag) {
    warnings.push(
      "The generated code block did not specify a language. Review the output before using it."
    );
  }

  return warnings;
}
