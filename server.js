const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

module.exports.io = io;

// Connect DB
connectDB();

// Routes
app.get("/", (req, res) => {
  res.send("LifeLink Backend Running...");
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/donors", require("./routes/donorRoutes"));
app.use("/api/hospitals", require("./routes/hospitalRoutes"));
app.use("/api/sos", require("./routes/sosRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/leaderboard", require("./routes/leaderboardRoutes"));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server + Socket.IO running on port ${PORT}`);
});
