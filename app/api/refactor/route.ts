export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "qwen/qwen-2.5-coder-32b-instruct:free";

const SYSTEM_PROMPT = `You are Referee, an expert AI code refactoring assistant.

You must respond using this exact response contract:
Markdown explanation first.
Then exactly one fenced code block containing the complete refactored code.
No extra commentary after the closing triple backticks.
No multiple alternatives.
No prose inside the code block.
No text after the final code fence.`;

type RefactorRequestBody = {
  code: string;
  language?: string;
  goal?: string;
  customContext?: string;
};

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRefactorRequestBody(body: unknown): RefactorRequestBody | Response {
  if (!isRecord(body)) {
    return jsonError("Request body must be a JSON object.", 400);
  }

  const { code, language, goal, customContext } = body;

  if (typeof code !== "string" || code.trim().length === 0) {
    return jsonError("A non-empty code field is required.", 400);
  }

  if (language !== undefined && typeof language !== "string") {
    return jsonError("The language field must be a string when provided.", 400);
  }

  if (goal !== undefined && typeof goal !== "string") {
    return jsonError("The goal field must be a string when provided.", 400);
  }

  if (customContext !== undefined && typeof customContext !== "string") {
    return jsonError(
      "The customContext field must be a string when provided.",
      400
    );
  }

  return {
    code,
    language: language?.trim() || "text",
    goal: goal?.trim() || "Improve Readability",
    customContext: customContext?.trim() || "No additional context provided.",
  };
}

function buildUserPrompt({
  code,
  language,
  goal,
  customContext,
}: RefactorRequestBody) {
  return `Refactor the following ${language} code.

Refactoring goal: ${goal}
Custom context or instructions: ${customContext}

Code to refactor:
\`\`\`${language}
${code}
\`\`\``;
}

function proxyStreamingBody(body: ReadableStream<Uint8Array>) {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            controller.close();
            return;
          }

          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsedBody = parseRefactorRequestBody(body);

  if (parsedBody instanceof Response) {
    return parsedBody;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return jsonError("OpenRouter API key is not configured.", 500);
  }

  const openRouterResponse = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://referee.local",
      "X-Title": "Referee",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      stream: true,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: buildUserPrompt(parsedBody),
        },
      ],
    }),
  });

  if (!openRouterResponse.ok) {
    return jsonError("Failed to start the refactoring stream.", 502);
  }

  if (!openRouterResponse.body) {
    return jsonError("OpenRouter did not return a streaming response.", 502);
  }

  return new Response(proxyStreamingBody(openRouterResponse.body), {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
