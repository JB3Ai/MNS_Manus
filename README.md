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

## Local verification

```bash
pnpm install
pnpm check
pnpm test
pnpm build
```

This project uses the Manus WebDev full-stack scaffold with Manus OAuth, tRPC, Drizzle and managed file storage.
