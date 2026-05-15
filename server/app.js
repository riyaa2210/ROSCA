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

// CORS — build allowed origins from CLIENT_URL env var
// CLIENT_URL can be comma-separated: "https://a.onrender.com,https://b.onrender.com"
const rawOrigins  = process.env.CLIENT_URL || "";
const allowedList = [
  "http://localhost:3000",
  "http://localhost:5173",
  ...rawOrigins.split(",").map((o) => o.trim()).filter(Boolean),
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, health checks, same-origin)
    if (!origin) return cb(null, true);
    // Always allow in development
    if (process.env.NODE_ENV !== "production") return cb(null, true);
    // Allow if origin is in the list
    if (allowedList.some((allowed) => origin.startsWith(allowed))) {
      return cb(null, true);
    }
    // Allow all *.onrender.com origins (covers preview deploys)
    if (origin.endsWith(".onrender.com")) return cb(null, true);
    console.warn("[CORS] Blocked:", origin);
    cb(new Error("CORS: not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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
app.use("/api/wallet",        require("./routes/walletRoutes"));
app.use("/api/cron",          require("./routes/cronRoutes"));
app.use("/api/risk",          require("./routes/riskRoutes"));

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
