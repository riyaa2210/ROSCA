"use strict";

const multer = require("multer");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ── File filter ───────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"), {
        code: "INVALID_FILE_TYPE",
        status: 400,
      }),
      false
    );
  }
};

// ── Memory storage (for S3 upload — file stays in buffer, not written to disk)
const memoryStorage = multer.memoryStorage();

// ── Disk storage (fallback when S3 is not configured) ────────────────────────
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = require("path").join(__dirname, "../uploads");
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${uuidv4()}${ext}`);
  },
});

// ── Choose storage based on S3 configuration ─────────────────────────────────
const { isS3Configured } = require("../config/s3");
const storage = isS3Configured() ? memoryStorage : diskStorage;

// ── Multer instance ───────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize:  MAX_FILE_SIZE,
    files:     1,           // max 1 file per request
    fieldSize: 1024 * 1024, // max 1MB for non-file fields
  },
});

// ── Error handler wrapper ─────────────────────────────────────────────────────
/**
 * uploadSingle(fieldName)
 *
 * Returns an Express middleware that handles multer errors gracefully.
 * Usage: router.post("/picture", uploadSingle("profilePic"), controller)
 */
function uploadSingle(fieldName) {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (!err) return next();

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        });
      }
      if (err.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({ message: err.message });
      }
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      next(err);
    });
  };
}

module.exports = upload;
module.exports.uploadSingle = uploadSingle;
