import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Starting server...");
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;
  console.log(`Port: ${PORT}`);

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // WebSocket handling
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-duel", (duelId) => {
      socket.join(duelId);
      console.log(`User ${socket.id} joined duel ${duelId}`);
      io.to(duelId).emit("user-joined", socket.id);
    });

    socket.on("select-track", (data) => {
      // Broadcast track selection to the room
      socket.to(data.duelId).emit("track-selected", data.trackUrl);
    });

    socket.on("start-duel", (duelId) => {
      // Broadcast start signal to the room
      io.to(duelId).emit("duel-started");
    });

    socket.on("duel-action", (data) => {
      // Broadcast action to the other user in the same room
      socket.to(data.duelId).emit("opponent-action", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Development mode");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Production mode");
    const distPath = path.join(__dirname, 'dist');
    console.log(`Dist path: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
