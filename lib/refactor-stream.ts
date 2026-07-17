type StreamDelta = {
  choices?: Array<{
    delta?: {
      content?: unknown;
    };
  }>;
};

export function splitRefactorResponse(content: string) {
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

export function extractDeltaContent(payload: unknown) {
  const streamDelta = payload as StreamDelta;
  const content = streamDelta.choices?.[0]?.delta?.content;

  return typeof content === "string" ? content : "";
}
