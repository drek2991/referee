type StreamDelta = {
  choices?: Array<{
    delta?: {
      content?: unknown;
    };
  }>;
};

export type RefactorResponseValidation = {
  hasCodeBlock: boolean;
  hasClosingFence: boolean;
  codeBlockCount: number;
  hasTrailingText: boolean;
  hasLanguageTag: boolean;
};

export function splitRefactorResponse(content: string) {
  const openingFenceIndex = content.indexOf("```");

  if (openingFenceIndex === -1) {
    return {
      explanation: content.trimStart(),
      code: "",
      fenceLanguage: "",
    };
  }

  const explanation = content.slice(0, openingFenceIndex).trim();
  const afterOpeningFence = content.slice(openingFenceIndex + 3);
  const openingLineMatch = afterOpeningFence.match(/^[^\r\n]*(?:\r?\n)?/);
  const openingLine = openingLineMatch?.[0] ?? "";
  const fenceLanguage = /\r?\n$/.test(openingLine)
    ? openingLine.trim().toLowerCase().split(/\s+/)[0]
    : "";
  const codeBlockBody = afterOpeningFence.slice(openingLine.length);
  const closingFenceIndex = codeBlockBody.indexOf("```");
  const code =
    closingFenceIndex === -1
      ? codeBlockBody
      : codeBlockBody.slice(0, closingFenceIndex).trimEnd();

  return {
    explanation,
    code,
    fenceLanguage,
  };
}

export function validateRefactorResponse(
  content: string
): RefactorResponseValidation {
  const firstOpeningFenceIndex = content.indexOf("```");

  if (firstOpeningFenceIndex === -1) {
    return {
      hasCodeBlock: false,
      hasClosingFence: false,
      codeBlockCount: 0,
      hasTrailingText: false,
      hasLanguageTag: false,
    };
  }

  const afterOpeningFence = content.slice(firstOpeningFenceIndex + 3);
  const openingLineMatch = afterOpeningFence.match(/^[^\r\n]*(?:\r?\n)?/);
  const openingLine = openingLineMatch?.[0] ?? "";
  const hasCompletedOpeningLine = /\r?\n$/.test(openingLine);
  const codeBlockBody = afterOpeningFence.slice(openingLine.length);
  const firstClosingFenceIndex = codeBlockBody.indexOf("```");

  if (firstClosingFenceIndex === -1) {
    return {
      hasCodeBlock: true,
      hasClosingFence: false,
      codeBlockCount: 1,
      hasTrailingText: false,
      hasLanguageTag: hasCompletedOpeningLine && Boolean(openingLine.trim()),
    };
  }

  const afterFirstClosingFence = codeBlockBody.slice(
    firstClosingFenceIndex + 3
  );
  const additionalFenceCount = (afterFirstClosingFence.match(/```/g) ?? [])
    .length;
  const codeBlockCount = 1 + Math.floor(additionalFenceCount / 2);
  const lastFenceIndex = afterFirstClosingFence.lastIndexOf("```");
  const textAfterLastFence =
    additionalFenceCount > 0 && lastFenceIndex !== -1
      ? afterFirstClosingFence.slice(lastFenceIndex + 3).trim()
      : afterFirstClosingFence.trim();

  return {
    hasCodeBlock: true,
    hasClosingFence: true,
    codeBlockCount,
    hasTrailingText: Boolean(textAfterLastFence),
    hasLanguageTag: hasCompletedOpeningLine && Boolean(openingLine.trim()),
  };
}

export function extractDeltaContent(payload: unknown) {
  const streamDelta = payload as StreamDelta;
  const content = streamDelta.choices?.[0]?.delta?.content;

  return typeof content === "string" ? content : "";
}
