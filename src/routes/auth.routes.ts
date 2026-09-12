import { IncomingMessage, ServerResponse } from "http";
import {
  registerController,
  loginController,
  meController,
} from "../controllers/auth.controller";
import {
  authenticate,
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

export const authRoutes = async (
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string
): Promise<boolean> => {
  if (req.method === "POST" && pathname === "/api/auth/register") {
    await registerController(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    await loginController(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/api/auth/me") {
    const authenticatedRequest = req as AuthenticatedRequest;

    if (!authenticate(authenticatedRequest, res)) {
      return true;
    }

    await meController(authenticatedRequest, res);
    return true;
  }

  return false;
};