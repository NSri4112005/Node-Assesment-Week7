import { IncomingMessage, ServerResponse } from "http";

import {
  addStockController,
  adjustStockController,
  getInventoryByProductController,
  getInventoryController,
  getLowStockController,
  getStockMovementsController,
  removeStockController,
} from "../controllers/inventory.controller";

import {
  authenticate,
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import { authorizeRoles } from "../middleware/role.middleware";
import { rateLimit } from "../middleware/rate-limit.middleware";

export const inventoryRoutes = async (
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string
): Promise<boolean> => {
  const authenticatedRequest = req as AuthenticatedRequest;

  // GET all inventory
  if (req.method === "GET" && pathname === "/api/inventory") {
    if (!authenticate(authenticatedRequest, res)) {
      return true;
    }

    await getInventoryController(req, res);
    return true;
  }

  // GET low-stock inventory
  if (
    req.method === "GET" &&
    pathname === "/api/inventory/low-stock"
  ) {
    if (!authenticate(authenticatedRequest, res)) {
      return true;
    }

    await getLowStockController(req, res);
    return true;
  }

  // Add stock
  const addMatch = pathname.match(
    /^\/api\/inventory\/([^/]+)\/add$/
  );

  if (req.method === "POST" && addMatch) {
    if (!authenticate(authenticatedRequest, res)) {
      return true;
    }

    if (
      !authorizeRoles(
        authenticatedRequest,
        res,
        ["admin", "staff"]
      )
    ) {
      return true;
    }

    if (!rateLimit(req, res, 30, 60_000)) {
      return true;
    }

    await addStockController(
      req,
      res,
      addMatch[1]
    );

    return true;
  }

  // Remove stock
  const removeMatch = pathname.match(
    /^\/api\/inventory\/([^/]+)\/remove$/
  );

  if (req.method === "POST" && removeMatch) {
    if (!authenticate(authenticatedRequest, res)) {
      return true;
    }

    if (
      !authorizeRoles(
        authenticatedRequest,
        res,
        ["admin", "staff"]
      )
    ) {
      return true;
    }

    if (!rateLimit(req, res, 30, 60_000)) {
      return true;
    }

    await removeStockController(
      req,
      res,
      removeMatch[1]
    );

    return true;
  }

  // Adjust stock - admin only
  const adjustMatch = pathname.match(
    /^\/api\/inventory\/([^/]+)\/adjust$/
  );

  if (req.method === "PATCH" && adjustMatch) {
    if (!authenticate(authenticatedRequest, res)) {
      return true;
    }

    if (
      !authorizeRoles(
        authenticatedRequest,
        res,
        ["admin"]
      )
    ) {
      return true;
    }

    await adjustStockController(
      req,
      res,
      adjustMatch[1]
    );

    return true;
  }

  // Stock movement history
  const historyMatch = pathname.match(
    /^\/api\/inventory\/([^/]+)\/history$/
  );

  if (req.method === "GET" && historyMatch) {
    if (!authenticate(authenticatedRequest, res)) {
      return true;
    }

    if (
      !authorizeRoles(
        authenticatedRequest,
        res,
        ["admin", "staff"]
      )
    ) {
      return true;
    }

    await getStockMovementsController(
      req,
      res,
      historyMatch[1]
    );

    return true;
  }

  // Get inventory by product
  const productMatch = pathname.match(
    /^\/api\/inventory\/([^/]+)$/
  );

  if (req.method === "GET" && productMatch) {
    if (!authenticate(authenticatedRequest, res)) {
      return true;
    }

    await getInventoryByProductController(
      req,
      res,
      productMatch[1]
    );

    return true;
  }

  // Not an inventory route
  return false;
};