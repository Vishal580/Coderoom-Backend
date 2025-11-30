# Coderoom — Backend

This repository contains the backend for Coderoom — a realtime collaborative code editor with an integrated compiler service (JDoodle) and socket.io-based collaboration.

Quick overview
- Node + Express HTTP server
- socket.io for realtime collaboration (rooms)
- /compile endpoint that proxies code execution to JDoodle
- CORS guarded by ALLOWED origin (uses PRODUCTION_URL in production)
- Deployed to Render (see Deploy section)

Requirements
- Node.js 18+
- npm
- A JDoodle account (clientId + clientSecret) — required for compile API

Environment (create `.env` in backend/)
Example .env:
```
PORT=5000
NODE_ENV=development
PRODUCTION_URL=https://your-frontend.example.com

# JDoodle credentials (required for /compile)
jDoodle_clientId=your_jdoodle_client_id
jDoodle_clientSecret=your_jdoodle_client_secret
```
Notes:
- Use the exact names above (jDoodle_clientId, jDoodle_clientSecret) or set the corresponding env vars in Render.
- On Render set these as secure environment variables (do NOT commit them).

Run locally
1. cd backend
2. npm install
3. npm start
- Server will listen on PORT (default 5000).
- nodemon may be used during development.

APIs
- POST /compile
  - Request body: { code: string, language: string }
  - Response: JDoodle response object (or { error: "..." } on failure)
  - Notes:
    - The backend maps `language` to a languageConfig.versionIndex before calling JDoodle.
    - Some language names expected by JDoodle differ — e.g. use `nodejs` for JavaScript runtime.
    - Common JDoodle errors:
      - 403 Unauthorized: check clientId/clientSecret and JDoodle plan/rate limits.
      - 400 Version index not supported: check languageConfig mapping.

Realtime events (socket.io)
- Client emits: ACTIONS.JOIN { roomId, username }
- Server emits to room on join: ACTIONS.JOINED { clients, username, socketId }
- Server emits when user disconnects: ACTIONS.DISCONNECTED { socketId, username }
- Code synchronization: ACTIONS.SYNC_CODE (used to send current code to newly joined clients)
- See Actions.js for exact event names and payload shapes.

CORS and Allowed Origin
- In development, allowed origin defaults to http://localhost:3000
- In production, set PRODUCTION_URL env var to your deployed frontend URL.

Deployment (Render)
- Create a new Web Service on Render.
- Connect your Git repo and pick the backend directory.
- Set the Start Command (example): `node index.js` or `npm start`.
- Set environment variables in the Render Dashboard:
  - PORT (optional)
  - PRODUCTION_URL (your frontend)
  - jDoodle_clientId
  - jDoodle_clientSecret
- Ensure the service has network access to api.jdoodle.com.

Troubleshooting
- "Server configuration error" returned by /compile:
  - Means JDoodle credentials are not found in env — verify `.env` or Render vars.
- JDoodle 403 / Unauthorized:
  - Confirm clientId/clientSecret are valid and not rate-limited.
- JDoodle 400 / Version index not supported:
  - Check `languageConfig` in index.js and ensure frontend sends supported language keys (e.g., `nodejs`).
- If socket connections fail:
  - Check allowed origin and that both frontend/backend use compatible socket.io client/server versions.

Useful curl for testing compile endpoint locally
```
curl -X POST http://localhost:5000/compile \
  -H "Content-Type: application/json" \
  -d '{"code":"console.log(\"hi\")","language":"nodejs"}'
```

Files of interest
- index.js — main server, REST endpoint and socket.io handling
- Actions.js — socket event constants
- .env (not checked in) — credentials and config
- package.json — start scripts