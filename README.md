# Coderoom — Backend

This backend provides realtime collaboration (Socket.IO), a code compilation proxy (JDoodle) and an integrated AI Assistant (Perplexity) used by the frontend chat widget.

Quick overview
- Node + Express HTTP server
- socket.io for realtime collaboration (rooms, join/leave, code sync)
- /compile endpoint that proxies execution to JDoodle
- /chat endpoint that proxies user queries to Perplexity (server-side) for AI assistant
- CORS guarded by DEV_URL / PRODUCTION_URL
- Deployed to Render (see Deploy section)

Requirements
- Node.js 18+
- npm
- JDoodle account (clientId + clientSecret) — required for compile API
- Perplexity account / API key — required for chat AI

Environment (create `.env` in backend/)
Example `.env`:
```
PORT=5000
NODE_ENV=development
DEV_URL=http://localhost:3000
PRODUCTION_URL=https://your-frontend.example.com

# JDoodle credentials (required for /compile)
jDoodle_clientId=your_jdoodle_client_id
jDoodle_clientSecret=your_jdoodle_client_secret

# Perplexity API key (required for /chat)
PERPLEXITY_API_KEY=sk_...
```
Notes:
- Use exact names above or set environment variables in Render. Do NOT commit `.env`.
- Restart the server after changing env vars.

Updated folder structure (important)
- controllers/
  - compileController.js  — handles /compile -> JDoodle
  - chatController.js     — handles /chat -> Perplexity
- routes/
  - compile.js
  - chat.js
- services/ (optional helpers)
  - jdoodle.js
  - perplexity.js
- index.js — server bootstrap, socket.io setup
- Actions.js — socket event constants
- package.json

APIs

- POST /compile
  - Request body: { code: string, language: string }
  - Response: JDoodle response object (or { error: "..." })
  - Notes:
    - Backend maps friendly language keys to JDoodle language/versionIndex.
    - Ensure jDoodle_clientId and jDoodle_clientSecret are set.

- POST /chat
  - Request body: { message: string }
  - Response: { reply: string, search_results?: [] }
  - Notes:
    - Backend requires PERPLEXITY_API_KEY and proxies requests to Perplexity.
    - The server returns sanitized reply + optional search results.
    - Keep user code / sensitive data out of queries or sanitize before sending.

Realtime events (socket.io)
- Client emits: ACTIONS.JOIN { roomId, username }
- Server emits to room on join: ACTIONS.JOINED { clients, username, socketId }
- Server emits on disconnect: ACTIONS.DISCONNECTED { socketId, username }
- Code sync: ACTIONS.SYNC_CODE — used to provide current editor content to joining clients

CORS and Allowed Origin
- Dev: DEV_URL defaults to http://localhost:3000
- Prod: set PRODUCTION_URL to your frontend deploy URL
- index.js uses allowed origin to configure io CORS

Deployment (Render)
- Create a Web Service for the backend on Render.
- Connect repo and set root directory to the backend folder.
- Start Command: `node index.js` or `npm start`
- Set the following Environment Variables in Render:
  - PRODUCTION_URL (frontend URL)
  - jDoodle_clientId
  - jDoodle_clientSecret
  - PERPLEXITY_API_KEY
- Ensure outbound network access to api.jdoodle.com and api.perplexity.ai

Local run
1. cd backend
2. npm install
3. npm start
4. Visit logs / console for startup messages

Testing endpoints locally
- Chat:
```
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I reverse a string in Python?"}'
```
- Compile:
```
curl -X POST http://localhost:5000/compile \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"hi\")","language":"python3"}'
```

Troubleshooting
- 500 on /chat:
  - Likely missing PERPLEXITY_API_KEY in backend env. Add it and restart.
  - Check backend logs for Perplexity API errors (rate limits, invalid key).
- 500 / "Server configuration error" on /compile:
  - Means JDoodle credentials missing or invalid.
- 404 Cannot POST /chat:
  - Ensure `app.use("/chat", require("./routes/chat"))` is present and server restarted.
- Socket issues:
  - Check allowed origin values and socket.io client/server versions.

Security & privacy
- API keys live only on the server (.env / Render env vars).
- Avoid sending full private code to external LLMs; sanitize or trim as necessary.
- Log errors but avoid printing raw secrets to logs.