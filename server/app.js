const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

const rawOrigins = process.env.CLIENT_URL || "";
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  ...rawOrigins.split(",").map((o) => o.trim()).filter(Boolean),
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    console.warn(`[CORS] Blocked origin: ${origin}`);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Handle preflight before rate limiter
app.options("*", cors());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/", limiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static: uploaded files ────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Static: React build (MUST be before API routes catch-all) ────────────────
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/users",         require("./routes/userRoutes"));
app.use("/api/groups",        require("./routes/groupRoutes"));
app.use("/api/payments",      require("./routes/paymentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ── React Router catch-all (MUST be after API routes) ────────────────────────
// Serves index.html for all non-API routes so React Router works
app.get("*", (req, res) => {
  const indexPath = path.join(publicPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).json({
      error: "Frontend not built",
      hint: "Run: cd ../client && npm install && npm run build",
    });
  }
});

// ── Error handling ────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
