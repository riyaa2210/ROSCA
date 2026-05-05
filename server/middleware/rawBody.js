"use strict";

/**
 * rawBodyMiddleware
 *
 * Captures the raw request body as a string BEFORE express.json() parses it.
 * Required for Razorpay webhook signature verification — the HMAC must be
 * computed over the exact raw bytes Razorpay sent.
 *
 * Usage: apply ONLY to the webhook route.
 *
 *   router.post("/webhook",
 *     rawBodyMiddleware,
 *     express.json(),
 *     handleWebhook
 *   );
 */
const rawBodyMiddleware = (req, res, next) => {
  let data = "";
  req.setEncoding("utf8");

  req.on("data", (chunk) => { data += chunk; });

  req.on("end", () => {
    req.rawBody = data;
    // Also parse JSON so req.body is available in the handler
    try {
      req.body = JSON.parse(data);
    } catch {
      req.body = {};
    }
    next();
  });

  req.on("error", next);
};

module.exports = rawBodyMiddleware;
