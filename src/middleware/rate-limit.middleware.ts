import { IncomingMessage, ServerResponse } from "http";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export const rateLimit = (
  req: IncomingMessage,
  res: ServerResponse,
  limit: number,
  windowMs: number
): boolean => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const clientIp =
    typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0].trim()
      : req.socket.remoteAddress || "unknown";

  const key = `${clientIp}:${req.method}:${req.url}`;
  const now = Date.now();

  const existing = rateLimitStore.get(key);

  if (!existing || now >= existing.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return true;
  }

  if (existing.count >= limit) {
    const retryAfter = Math.ceil(
      (existing.resetAt - now) / 1000
    );

    res.writeHead(429, {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfter),
    });

    res.end(
      JSON.stringify({
        success: false,
        message: "Too many requests. Please try again later.",
      })
    );

    return false;
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return true;
};