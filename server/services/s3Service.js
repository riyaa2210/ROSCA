"use strict";

const path   = require("path");
const fs     = require("fs");
const { v4: uuidv4 } = require("uuid");

// ── Local storage fallback ────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ── Lazy-load AWS SDK (only if S3 is configured) ──────────────────────────────
let _s3Ops = null;

function getS3Ops() {
  if (_s3Ops) return _s3Ops;

  const { getS3Client, isS3Configured } = require("../config/s3");
  if (!isS3Configured()) return null;

  const {
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
  } = require("@aws-sdk/client-s3");
  const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

  _s3Ops = { getS3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, getSignedUrl };
  return _s3Ops;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract the S3 key from a full S3 URL.
 * e.g. "https://bucket.s3.ap-south-1.amazonaws.com/profiles/uuid.jpg"
 *   → "profiles/uuid.jpg"
 */
function extractS3Key(url) {
  if (!url || !url.includes("amazonaws.com")) return null;
  try {
    const parsed = new URL(url);
    // pathname starts with "/" — remove it
    return parsed.pathname.slice(1);
  } catch {
    return null;
  }
}

/**
 * isS3Url — returns true if the URL points to S3
 */
function isS3Url(url) {
  return url && url.includes("amazonaws.com");
}

// ── Core operations ───────────────────────────────────────────────────────────

/**
 * uploadToS3(file, folder)
 *
 * Uploads a file buffer to S3 and returns the public URL.
 * Falls back to local disk if S3 is not configured.
 *
 * @param {Express.Multer.File} file   - multer file object (memoryStorage)
 * @param {string}              folder - S3 folder prefix e.g. "profiles"
 * @returns {Promise<string>}          - public URL of the uploaded file
 */
async function uploadToS3(file, folder = "profiles") {
  const ops = getS3Ops();

  // ── S3 path ───────────────────────────────────────────────────────────────
  if (ops) {
    const ext    = path.extname(file.originalname).toLowerCase() || ".jpg";
    const key    = `${folder}/${uuidv4()}${ext}`;
    const bucket = process.env.AWS_S3_BUCKET;

    const command = new ops.PutObjectCommand({
      Bucket:      bucket,
      Key:         key,
      Body:        file.buffer,
      ContentType: file.mimetype,
      // Do NOT set ACL: "public-read" — use bucket policy or presigned URLs instead
      // This keeps the bucket private (security best practice)
      Metadata: {
        originalName: encodeURIComponent(file.originalname),
        uploadedBy:   "savesangam-api",
      },
    });

    await ops.getS3Client().send(command);

    // Return the public URL (works if bucket has a public read policy)
    // For private buckets, use getPresignedUrl() instead
    const region = process.env.AWS_REGION;
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  // ── Local fallback ────────────────────────────────────────────────────────
  const ext      = path.extname(file.originalname).toLowerCase() || ".jpg";
  const filename = `${uuidv4()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/${filename}`;
}

/**
 * deleteFile(url)
 *
 * Deletes a file from S3 or local disk based on the URL.
 * Silent on errors — a failed delete should not block the upload flow.
 *
 * @param {string} url - the URL previously returned by uploadToS3
 */
async function deleteFile(url) {
  if (!url) return;

  try {
    // ── S3 delete ─────────────────────────────────────────────────────────
    if (isS3Url(url)) {
      const ops = getS3Ops();
      if (!ops) return;

      const key = extractS3Key(url);
      if (!key) return;

      const command = new ops.DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key:    key,
      });

      await ops.getS3Client().send(command);
      return;
    }

    // ── Local delete ──────────────────────────────────────────────────────
    const filename = path.basename(url);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    // Log but don't throw — delete failure is non-critical
    console.error("[S3Service] deleteFile error:", err.message);
  }
}

/**
 * getPresignedUrl(s3Url, expiresInSeconds)
 *
 * Generates a time-limited presigned URL for a private S3 object.
 * Use this when the bucket is private (recommended for production).
 *
 * @param {string} s3Url          - the S3 URL stored in MongoDB
 * @param {number} expiresInSeconds - default 3600 (1 hour)
 * @returns {Promise<string>}     - presigned URL
 */
async function getPresignedUrl(s3Url, expiresInSeconds = 3600) {
  const ops = getS3Ops();
  if (!ops || !isS3Url(s3Url)) return s3Url; // return as-is for local URLs

  const key = extractS3Key(s3Url);
  if (!key) return s3Url;

  const command = new ops.GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key:    key,
  });

  return ops.getSignedUrl(ops.getS3Client(), command, { expiresIn: expiresInSeconds });
}

// ── Legacy exports (backward compat with existing code) ───────────────────────
exports.deleteLocalFile = deleteFile; // old name used in userController

// ── Named exports ─────────────────────────────────────────────────────────────
exports.uploadToS3      = uploadToS3;
exports.deleteFile      = deleteFile;
exports.getPresignedUrl = getPresignedUrl;
exports.isS3Url         = isS3Url;
exports.extractS3Key    = extractS3Key;
