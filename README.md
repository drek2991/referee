# Referee

Referee is an AI-powered code refactoring workspace that turns a focused natural-language request into a streamed refactor plan and a cleaner implementation in a dual-editor interface.

**Live demo:** [referee-sigma.vercel.app](https://referee-sigma.vercel.app/)

## Overview

Referee turns a focused refactoring request into an interactive review experience. Developers edit JavaScript, TypeScript, or Python in Monaco, describe what should be improved, and watch a behavior-preserving plan and refactored output arrive progressively from a server-side AI integration.

## MVP Features

- Responsive, dark-mode development workspace
- Editable Monaco input editor and read-only Monaco output editor
- Primary natural-language refactor request control
- Secure server-side OpenRouter integration
- Real-time SSE response streaming
- Client-side separation of markdown explanation and fenced code output
- Progressive explanation and code rendering
- Production deployment on Vercel

## Supported Scope

### Available now

- **Languages:** JavaScript, TypeScript, and Python
- **Requests:** Freeform, behavior-preserving improvements to structure, readability, maintainability, organization, or safe efficiency

### Coming soon

The interface previews planned language options, but they are disabled and cannot be submitted:

- **Languages:** Rust and Go

Bug fixing, feature generation, and intentional behavior changes remain outside Referee's current scope. The assistant redirects those requests toward safe refactoring.

## Architecture

```text
Browser workspace
  ├─ Editable Monaco input
  ├─ Freeform refactor request
  └─ Read-only output + markdown refactor plan
            │
            │ POST /api/refactor
            ▼
Next.js App Router route handler
  ├─ Validates the request
  ├─ Reads OPENROUTER_API_KEY on the server
  └─ Proxies OpenRouter's SSE stream
            │
            ▼
Client stream parser
  ├─ Extracts choices[0].delta.content
  ├─ Accumulates the streamed response
  └─ Splits explanation from the fenced code block
```

The browser never calls OpenRouter directly and never receives the API key.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Monaco Editor via `@monaco-editor/react`
- OpenRouter chat completions API
- Server-Sent Events and Web Streams
- Vercel

## Local Setup

### Prerequisites

- Node.js 20 or newer
- npm
- An [OpenRouter](https://openrouter.ai/) API key

### Installation

```bash
git clone https://github.com/drek2991/referee.git
cd referee
npm install
cp .env.example .env.local
```

Add your OpenRouter key to `.env.local`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variable Security

`OPENROUTER_API_KEY` must remain server-only. Do **not** rename it to, duplicate it as, or expose it through `NEXT_PUBLIC_OPENROUTER_API_KEY`; variables prefixed with `NEXT_PUBLIC_` are bundled for the browser.

Local `.env*` files are ignored by Git, while `.env.example` documents the required configuration without containing a secret.

## Streaming Flow

1. The client sends `code`, `language`, and a non-empty `refactorRequest` to `POST /api/refactor`.
2. The route validates the selected supported language and behavior-preserving request, then calls OpenRouter with streaming enabled.
3. OpenRouter-compatible SSE chunks are proxied to the browser as they arrive.
4. The client extracts incremental `choices[0].delta.content` values.
5. The response uses a `javascript`, `typescript`, or `python` fence that matches the selected language.
6. Accumulated text is split at the first fenced code block:
   - content before the fence becomes the markdown explanation;
   - content inside the fence becomes the read-only Monaco output.
7. Both panels update progressively without waiting for the complete response.

## MVP Limitations

Referee intentionally keeps its first release focused:

- JavaScript, TypeScript, and Python are the only enabled languages.
- Refactoring is single-file, text-based, and behavior-preserving.
- Bug fixes, new features, and intentional behavior changes are redirected rather than implemented.
- AI output can vary and should be reviewed before use.
- Free OpenRouter models may be rate-limited or temporarily unavailable.
- There is no authentication, database, saved history, analytics, model picker, or automated code execution.

## Future Improvements

- Enable the remaining previewed languages after validation
- Add stronger response-contract validation and recovery
- Support multi-file refactoring context
- Add optional refactoring history and project persistence
- Expand accessibility and editor productivity controls

## Scripts

```bash
npm run dev    # Start the development server
npm run build  # Create a production build
npm run start  # Start the production server
npm run lint   # Run ESLint
```
