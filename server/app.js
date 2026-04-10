const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/", limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
