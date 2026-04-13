const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();

const publicPath = path.join(__dirname, "public");

// ── Log startup info ──────────────────────────────────────────────────────────
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("publicPath:", publicPath);
console.log("public exists:", fs.existsSync(publicPath));
console.log("index.html exists:", fs.existsSync(path.join(publicPath, "index.html")));

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// Wide-open CORS — safe because frontend is same origin on Render
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", cors());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/", limiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static files — serve FIRST before any routes ─────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(publicPath));

// ── Debug endpoint ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    publicExists: fs.existsSync(publicPath),
    indexExists: fs.existsSync(path.join(publicPath, "index.html")),
    publicContents: fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : [],
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/users",         require("./routes/userRoutes"));
app.use("/api/groups",        require("./routes/groupRoutes"));
app.use("/api/payments",      require("./routes/paymentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/ai",            require("./routes/aiRoutes"));
app.use("/api/search",        require("./routes/searchRoutes"));

// ── React Router catch-all ────────────────────────────────────────────────────
app.get("*", (req, res) => {
  const indexPath = path.join(publicPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send(`
      <h2>Frontend not built</h2>
      <p>publicPath: ${publicPath}</p>
      <p>exists: ${fs.existsSync(publicPath)}</p>
    `);
  }
});

// ── Error handling ────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
