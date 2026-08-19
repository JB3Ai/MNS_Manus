# Optional DukeBox Shared-Passenger Bridge

Use the included `The-DukeBox-of-London/server.js` only on cPanel hosts where the root DukeBox Passenger application captures `/nms` even though a separate NMS application is registered.

The bridge preserves DukeBox routes and mounts the NMS Express app at `/nms` before the DukeBox static fallback. It loads NMS variables from `/home/appjbaic/repositories/nms/.env`, imports `/home/appjbaic/repositories/nms/index.js`, and prevents the NMS server from opening a second listener.

Always back up the live DukeBox `server.js` before replacement. After replacement, fully **Stop App** and **Start App** in cPanel. Verify both `/health` and `/nms/healthz` before testing PIN access.

Do not commit or distribute production secrets. The integration file contains no API keys, PINs, JWT secrets, reviewer data, or cPanel credentials.
