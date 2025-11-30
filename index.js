const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const ACTIONS = require("./Actions");
const cors = require("cors");
const axios = require("axios");
const server = http.createServer(app);
require("dotenv").config();

const languageConfig = {
  python3: { versionIndex: "3" },
  java: { versionIndex: "3" },
  javascript: { versionIndex: "3" },
  cpp: { versionIndex: "4" },
  nodejs: { versionIndex: "3" },
  c: { versionIndex: "4" },
  ruby: { versionIndex: "3" },
  go: { versionIndex: "3" },
  scala: { versionIndex: "3" },
  bash: { versionIndex: "3" },
  sql: { versionIndex: "3" },
  pascal: { versionIndex: "2" },
  csharp: { versionIndex: "3" },
  php: { versionIndex: "3" },
  swift: { versionIndex: "3" },
  rust: { versionIndex: "3" },
  r: { versionIndex: "3" },
};

const isProduction = process.env.NODE_ENV === "production";

const allowedOrigin = isProduction
  ? process.env.PRODUCTION_URL
  : "http://localhost:3000";

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
  },
});

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

const userSocketMap = {};
const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  // console.log('Socket connected', socket.id);
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    // notify that new user join
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  // sync the code
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  // when new user join the room all the code which are there are also shows on that persons editor
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // leave room
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    // leave all the room
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });

    delete userSocketMap[socket.id];
    socket.leave();
  });
});

app.post("/compile", async (req, res) => {
  const { code, language } = req.body;

  // normalize and validate language (frontend may send "c++" and "nodejs/javascript")
  const normalizedLanguage =
    language === "c++" ? "cpp" : language === "nodejs/javascript" ? "nodejs" : language;
  if (!languageConfig[normalizedLanguage]) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  // use correct env var names — ensure these exist in backend/.env
  const clientId = process.env.jDoodle_clientId1 || process.env.jDoodle_clientId2;
  const clientSecret = process.env.jDoodle_clientSecret1 || process.env.jDoodle_clientSecret2;
  if (!clientId || !clientSecret) {
    console.error("Missing JDoodle credentials (check backend/.env)");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      script: code,
      language: normalizedLanguage,
      versionIndex: languageConfig[normalizedLanguage].versionIndex,
      clientId,
      clientSecret,
    });

    return res.json(response.data);
  } catch (error) {
    // log JDoodle response body when available to help debugging
    console.error("JDoodle error:", error.response?.data || error.message);
    const status = error.response?.status || 500;
    return res
      .status(status)
      .json({ error: error.response?.data?.error || "Failed to compile code" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is runnint on port ${PORT}`));
