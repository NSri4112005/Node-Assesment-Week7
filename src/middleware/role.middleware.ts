import { ServerResponse } from "http";
import { AuthenticatedRequest } from "./auth.middleware";
import { UserRole } from "../models/user.model";

export const authorizeRoles = (
  req: AuthenticatedRequest,
  res: ServerResponse,
  allowedRoles: UserRole[]
): boolean => {
  if (!req.user) {
    res.writeHead(401, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        success: false,
        message: "Unauthorized",
      })
    );

    return false;
  }

  if (!allowedRoles.includes(req.user.role)) {
    res.writeHead(403, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        success: false,
        message: "Access denied: insufficient permissions",
      })
    );

    return false;
  }

  return true;
};