import { IncomingMessage, ServerResponse } from "http";
import { authRoutes } from "./routes/auth.routes";
import { productRoutes } from "./routes/product.routes";

export const router = async (
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> => {
  const url = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`
  );

  const pathname = url.pathname;
  const queryParams = url.searchParams;

  // Authentication routes
  if (await authRoutes(req, res, pathname)) {
    return true;
  }

  // Product routes
  if (
    await productRoutes(
      req,
      res,
      pathname,
      queryParams
    )
  ) {
    return true;
  }

  return false;
};