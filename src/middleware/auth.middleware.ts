import { IncomingMessage, ServerResponse } from "http";
import { verifyToken } from "../utils/jwt";
import { AuthPayload } from "../types/auth.types";

export interface AuthenticatedRequest extends IncomingMessage {
  user?: AuthPayload;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: ServerResponse
): boolean => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    res.writeHead(401, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        success: false,
        message: "Authorization token is required",
      })
    );

    return false;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.writeHead(401, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        success: false,
        message: "Invalid authorization format",
      })
    );

    return false;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    return true;
  } catch {
    res.writeHead(401, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        success: false,
        message: "Invalid or expired token",
      })
    );

    return false;
  }
};