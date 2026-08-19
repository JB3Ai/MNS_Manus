# NMS Executive Portal — cPanel Deployment

This Node.js 22 package is prepared for `https://app.jb3ai.com/nms`. It supports two safe deployment modes. Use **Mode A** when the host correctly honours nested Passenger applications. Use **Mode B** when an existing root Passenger application captures all subpaths before the `/nms` application mapping.

## Required NMS files and environment

The NMS application root is `/home/appjbaic/repositories/nms` and must contain `index.js`, `package.json`, `package-lock.json`, `public/`, and this guide.

| Variable | Required value |
| --- | --- |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | A long random value generated with `openssl rand -hex 32` |
| `NMS_PORTAL_PIN` | The private client PIN |
| `NMS_COOKIE_PATH` | `/nms` |
| `NMS_DATA_FILE` | `/home/appjbaic/private/nms/portal-data.json` |

The private JSON file stores executive decisions and per-reviewer document progress without MySQL. Create `/home/appjbaic/private/nms`, restrict it to the account owner, and back up `portal-data.json` before migrations.

## Mode A — isolated Passenger application

Use these settings when `/nms/healthz` reaches the NMS application directly.

| Setting | NMS value |
| --- | --- |
| Node.js version | Node.js 22 |
| Application mode | Production |
| Application root | `repositories/nms` |
| Application URL | `app.jb3ai.com/nms` |
| Startup file | `index.js` |

Upload and extract the ZIP into `repositories/nms`, run **NPM Install** or `npm install --omit=dev`, configure the variables above, and restart only the NMS application.

## Mode B — shared root Passenger process

Use this mode only when the host confirms the `/nms` registration exists but `https://app.jb3ai.com/nms/healthz` still returns the root application. This server exhibited that behaviour because DukeBox was mounted at `/` and its Express fallback captured every subpath.

The package includes `integration/The-DukeBox-of-London/server.js`, the verified bridge used on this server. It mounts the exported NMS Express app at `/nms` **before** DukeBox static and fallback routes. The NMS code, assets, PIN cookie, and JSON persistence remain isolated in `repositories/nms` and `/home/appjbaic/private/nms`.

Before replacing the root entrypoint:

1. Back up `repositories/The-DukeBox-of-London/server.js`.
2. Confirm the NMS application files and production dependencies are installed in `repositories/nms`.
3. Confirm the NMS `.env` contains only the required NMS variables above.
4. Replace the DukeBox `server.js` with the verified integration copy.
5. Fully stop and start the DukeBox cPanel application so Passenger reloads the file.
6. Do not create a manual `public_html/nms/.htaccess` mount under an already active root Passenger application.

The bridge reads `/home/appjbaic/repositories/nms/.env`, sets `NMS_EMBEDDED=1`, imports the NMS server, and mounts it under `/nms`. The NMS server starts its own listener only in standalone mode.

## Verification

Run these checks after deployment:

1. `https://app.jb3ai.com/health` returns `{"status":"ok","project":"The DukeBox of London"}`.
2. `https://app.jb3ai.com/nms/healthz` returns `{"ok":true,"service":"nms-executive-portal"}`.
3. `https://app.jb3ai.com/nms/` shows the NMS confidential unlock screen, not DukeBox and not a frontend 404.
4. PIN login and confidentiality acknowledgement open the main proposal.
5. A protected PDF returns `401` before login and opens in-browser after login.
6. Document review progress and decision records remain after refresh.
7. The NMS cookie is scoped to `/nms`, and DukeBox root/API routes remain unchanged.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `/nms/healthz` shows DukeBox HTML | The root Passenger app is capturing the subpath; use Mode B or correct the host-level nested mapping |
| The NMS UI shows its own 404 page | Confirm this package's `/nms/` frontend build is installed; the Wouter router must use the Vite base path |
| Assets return HTML | Confirm `public/index.html` references the current hashed files under `public/assets/` |
| PIN loops | Confirm HTTPS, `NMS_PORTAL_PIN`, `JWT_SECRET`, and `NMS_COOKIE_PATH=/nms` |
| Documents return `401` after login | Confirm the browser accepted the secure PIN cookie and the requested file remains under `/nms/manus-storage/` |
| Progress does not save | Confirm `/home/appjbaic/private/nms` is writable by `appjbaic` |
| DukeBox fails after bridge deployment | Restore the backed-up DukeBox `server.js`, fully stop/start the root app, and inspect its Passenger log |
