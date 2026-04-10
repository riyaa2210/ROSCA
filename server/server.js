require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "*", credentials: true },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_group", (groupId) => {
    socket.join(`group_${groupId}`);
  });

  socket.on("leave_group", (groupId) => {
    socket.leave(`group_${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Make io accessible in controllers
app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
