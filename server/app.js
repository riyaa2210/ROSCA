const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // allow Razorpay scripts in production
}));

// Build allowed origins list from env
// CLIENT_URL can be a comma-separated list:
//   e.g. "https://bhishi.vercel.app,https://www.bhishi.vercel.app"
const rawOrigins = process.env.CLIENT_URL || "";
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  ...rawOrigins.split(",").map((o) => o.trim()).filter(Boolean),
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Render health checks, curl, Postman)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    console.warn(`[CORS] Blocked origin: ${origin}`);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── Preflight (OPTIONS) — must be before rate limiter ────────────────────────
app.options("*", cors());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/", limiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve uploaded files ──────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/users",         require("./routes/userRoutes"));
app.use("/api/groups",        require("./routes/groupRoutes"));
app.use("/api/payments",      require("./routes/paymentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ── Serve React build in production ──────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const publicPath = path.join(__dirname, "public");
  const fs = require("fs");

  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));

    // All non-API routes → React app (client-side routing)
    app.get("*", (req, res) => {
      const indexPath = path.join(publicPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(503).send("Frontend build not found. Run: npm run build");
      }
    });
  } else {
    app.get("*", (req, res) => {
      res.status(503).send("Frontend build not found. Run: npm run build");
    });
  }
}

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
