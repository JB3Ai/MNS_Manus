# NMS Renewal Portal

Secure executive proposal and decision portal for the Natural Medicinal Services transformation programme.

## Included

- Passcode-only private client access with a server-validated PIN and signed 12-hour session cookie
- Consolidated proposal covering history, current state, gated implementation, new brand, marketing, products, compliance, customer engagement, commerce, risk and indicative costing
- Three live design directions: Heritage Apothecary, Modern Botanical, and Clinical Nature / NMS Standard
- Per-user executive decision register
- Shared PIN-session executive decision register
- Drizzle/MySQL schema for portal seats and recorded decisions
- Master proposal and supporting source-of-truth documents in `docs/`
- cPanel deployment guidance for isolated and shared-root Passenger configurations in `deployment/cpanel/`

## Live environments

- Manus managed hosting: `https://nmsportal-zxbbdyq3.manus.space`
- cPanel client portal: `https://app.jb3ai.com/nms/`
- cPanel health check: `https://app.jb3ai.com/nms/healthz`

The cPanel deployment uses a `/nms/`-aware Vite build, a Wouter base path, a signed PIN cookie scoped to `/nms`, and private JSON persistence outside the public web root. On hosts where the root Passenger application captures subpaths, the optional verified DukeBox bridge mounts the exported NMS Express application before the root fallback.

## Local verification

```bash
pnpm install
pnpm check
pnpm test
pnpm build
```

The verified release passes 12 automated tests, TypeScript checking, a production `/nms/` build, live PIN authentication, protected-document access, persistent vault tracking, and independent DukeBox and NMS health checks.

This project uses the Manus WebDev full-stack scaffold with Manus OAuth, tRPC, Drizzle and managed file storage.
