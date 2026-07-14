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

1. Confirm the page displays `AI refactoring cockpit`.
2. Wait until at least two `.monaco-editor` elements render.
3. Type into the first Monaco editor and confirm Monaco's first model value changes.
4. Click `Refactor Code` and confirm the second Monaco model updates from the input state.
5. Try typing into the second Monaco editor and confirm the second model does not change.
6. Probe responsive overflow at desktop and mobile widths by comparing `document.documentElement.scrollWidth` to `clientWidth`.

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
