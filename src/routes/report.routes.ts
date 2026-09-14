import { IncomingMessage, ServerResponse } from "http";
import {
  exportInventoryCsvController,
  getInventoryReportController,
} from "../controllers/report.controller";
import {
  authenticate,
  AuthenticatedRequest,
} from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

export const reportRoutes = async (
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string
): Promise<boolean> => {
  const authenticatedRequest = req as AuthenticatedRequest;

  if (
    req.method === "GET" &&
    pathname === "/api/reports/inventory"
  ) {
    if (!authenticate(authenticatedRequest, res)) {
      return true;
    }

    if (!authorizeRoles(authenticatedRequest, res, ["admin"])) {
      return true;
    }

    await getInventoryReportController(req, res);
    return true;
  }

  if (
    req.method === "GET" &&
    pathname === "/api/reports/inventory/export"
  ) {
    if (!authenticate(authenticatedRequest, res)) {
      return true;
    }

    if (!authorizeRoles(authenticatedRequest, res, ["admin"])) {
      return true;
    }

    exportInventoryCsvController(req, res);
    return true;
  }

  return false;
};