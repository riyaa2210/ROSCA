const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
const path      = require("path");
const fs        = require("fs");
const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const publicPath = path.join(__dirname, "public");

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — allow same-origin requests AND the separate frontend URL if set
const rawOrigins  = process.env.CLIENT_URL || "";
const allowedList = [
  "http://localhost:3000",
  "http://localhost:5173",
  ...rawOrigins.split(",").map((o) => o.trim()).filter(Boolean),
];

app.use(cors({
  origin: (origin, cb) => {
    // No origin = same-origin / Postman / health checks
    if (!origin) return cb(null, true);
    if (allowedList.includes(origin)) return cb(null, true);
    // In production with no CLIENT_URL set, allow everything (same-service deploy)
    if (!process.env.CLIENT_URL) return cb(null, true);
    console.warn("[CORS] Blocked:", origin);
    cb(new Error("CORS: not allowed"));
  },
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

// ── Static files ──────────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(publicPath));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env:    process.env.NODE_ENV,
    built:  fs.existsSync(path.join(publicPath, "index.html")),
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
app.use("/api/analytics",     require("./routes/analyticsRoutes"));

// ── React Router catch-all (only when frontend is bundled here) ───────────────
app.get("*", (req, res) => {
  const indexPath = path.join(publicPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// ── Error handling ────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
