const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const ACTIONS = require("./Actions");
const cors = require("cors");
const axios = require("axios");
const server = http.createServer(app);
require("dotenv").config();

const compileRoute = require("./routes/compile");
const chatRoute = require("./routes/chat");

const isProduction = process.env.NODE_ENV === "production";

const allowedOrigin = isProduction
  ? process.env.PRODUCTION_URL
  : process.env.DEV_URL || "http://localhost:3000";

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
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

app.use("/compile", compileRoute);
app.use("/chat", chatRoute);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is runnint on port ${PORT}`));
