"use strict";

const { S3Client } = require("@aws-sdk/client-s3");

/**
 * S3 Client — AWS SDK v3
 *
 * Security best practices:
 *  1. Credentials come from env vars ONLY — never hardcoded
 *  2. On EC2/ECS/Lambda, use IAM roles instead of access keys
 *     (omit AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY — SDK picks up role automatically)
 *  3. Bucket should have:
 *     - Block all public access: ON
 *     - Versioning: ON (for accidental delete recovery)
 *     - Server-side encryption: AES-256 or KMS
 *     - Lifecycle rules: delete old versions after 30 days
 *  4. IAM policy for this app should allow ONLY:
 *     s3:PutObject, s3:DeleteObject, s3:GetObject on the specific bucket
 */

let s3Client = null;

function getS3Client() {
  if (s3Client) return s3Client;

  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error("AWS_REGION is not set in environment variables");
  }

  const config = { region };

  // Use explicit credentials only if provided (local dev).
  // In production on AWS (EC2/ECS/Lambda), omit these — IAM role is used automatically.
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  s3Client = new S3Client(config);
  return s3Client;
}

/**
 * isS3Configured()
 * Returns true if all required S3 env vars are set.
 * Used to decide whether to use S3 or fall back to local storage.
 */
function isS3Configured() {
  return !!(
    process.env.AWS_REGION &&
    process.env.AWS_S3_BUCKET &&
    (
      // Either explicit credentials (local dev) or IAM role (production)
      (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
      process.env.AWS_USE_IAM_ROLE === "true"
    )
  );
}

module.exports = { getS3Client, isS3Configured };
