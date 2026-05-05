require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const { initSchedulers } = require("./schedulers");

const startServer = async () => {
  // 1. Connect to MongoDB first
  await connectDB();

  // 2. Start cron schedulers (requires DB connection)
  initSchedulers();

  // 3. Create HTTP + Socket.io server
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || "*", credentials: true },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.on("join_group",  (groupId) => socket.join(`group_${groupId}`));
    socket.on("leave_group", (groupId) => socket.leave(`group_${groupId}`));
    socket.on("disconnect",  ()        => console.log("Socket disconnected:", socket.id));
  });

  app.set("io", io);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
