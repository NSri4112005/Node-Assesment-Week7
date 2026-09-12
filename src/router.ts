import { IncomingMessage, ServerResponse } from "http";
import { authRoutes } from "./routes/auth.routes";

export const router = async (
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> => {
  const pathname = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`
  ).pathname;

  // Authentication routes
  if (await authRoutes(req, res, pathname)) {
    return true;
  }

  return false;
};