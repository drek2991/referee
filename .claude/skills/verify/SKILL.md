---
description: Verify the Referee Next.js workspace by launching the app and driving it in Chromium.
---

# Referee workspace verification

Use this skill to verify UI/runtime changes in this single-package Next.js app.

## Launch

```bash
npm run dev
```

Wait for `Ready` and `Local: http://localhost:3000`.

## Build sanity

For implementation-ticket acceptance, run:

```bash
npm run build
npm run lint
```

## Runtime checks

Drive the running app in Chromium at `http://localhost:3000`.

Recommended checks for the Monaco workspace:

1. Confirm the page displays `Refactor with intent. Preserve behavior.`.
2. Wait until at least two `.monaco-editor` elements render.
3. Confirm JavaScript and TypeScript are enabled while Python, Rust, and Go remain disabled.
4. Switch between JavaScript and TypeScript and confirm both Monaco model language IDs follow the selection.
5. Type into the first Monaco editor and confirm Monaco's first model value changes.
6. Submit both JavaScript and TypeScript refactor requests and confirm the second Monaco model updates from the input state.
7. Confirm the indeterminate activity bar, streaming phase, elapsed time, and pre-code waiting state appear at the expected stream stages.
8. Drive a stalled stream past the timeout and confirm it aborts, preserves partial content, shows focused retry guidance, and permits another request.
9. Return mismatched supported, upcoming, and unknown fence tags and confirm friendly hints appear without changing the selected language.
10. Complete responses with no fence, multiple blocks, trailing prose, and a missing tag; confirm final warnings appear only after completion and only first-block code enters Monaco.
11. Confirm an explanation-only response leaves the output editor empty.
12. Try typing into the second Monaco editor and confirm the second model does not change.
13. Probe responsive overflow at desktop and mobile widths by comparing `document.documentElement.scrollWidth` to `clientWidth`.

## Headless Chromium gotchas

This container runs as root, so launch Chromium as `nobody` instead of using `--no-sandbox`:

```bash
rm -rf /tmp/referee-chromium-home /tmp/referee-chromium-profile
mkdir -p /tmp/referee-chromium-home /tmp/referee-chromium-profile
chown nobody:nogroup /tmp/referee-chromium-home /tmp/referee-chromium-profile
runuser -u nobody -- env HOME=/tmp/referee-chromium-home chromium --headless=new --disable-gpu --window-size=1440,1100 http://localhost:3000
```

For Chrome DevTools Protocol automation, include a remote debugging port and matching allowed origin, for example:

```bash
runuser -u nobody -- env HOME=/tmp/referee-chromium-home chromium \
  --headless=new \
  --disable-gpu \
  --remote-debugging-port=9226 \
  --remote-allow-origins=http://127.0.0.1:9226 \
  --user-data-dir=/tmp/referee-chromium-profile \
  --window-size=1440,1100 \
  http://localhost:3000
```
