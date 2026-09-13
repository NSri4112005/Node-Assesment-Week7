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

  if (!authenticate(authenticatedRequest, res)) {
    return true;
  }

  // GET all inventory
  if (req.method === "GET" && pathname === "/api/inventory") {
    await getInventoryController(req, res);
    return true;
  }

  // GET low-stock inventory
  if (
    req.method === "GET" &&
    pathname === "/api/inventory/low-stock"
  ) {
    await getLowStockController(req, res);
    return true;
  }

  // POST add stock
  const addMatch = pathname.match(
    /^\/api\/inventory\/([^/]+)\/add$/
  );

  if (req.method === "POST" && addMatch) {
    if (
      !authorizeRoles(
        authenticatedRequest,
        res,
        ["admin", "staff"]
      )
    ) {
      return true;
    }

    // Maximum 30 add-stock requests per minute per client
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

  // POST remove stock
  const removeMatch = pathname.match(
    /^\/api\/inventory\/([^/]+)\/remove$/
  );

  if (req.method === "POST" && removeMatch) {
    if (
      !authorizeRoles(
        authenticatedRequest,
        res,
        ["admin", "staff"]
      )
    ) {
      return true;
    }

    // Maximum 30 remove-stock requests per minute per client
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

  // PATCH adjust stock
  const adjustMatch = pathname.match(
    /^\/api\/inventory\/([^/]+)\/adjust$/
  );

  if (req.method === "PATCH" && adjustMatch) {
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

  // GET stock movement history
  const historyMatch = pathname.match(
    /^\/api\/inventory\/([^/]+)\/history$/
  );

  if (req.method === "GET" && historyMatch) {
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

  // GET inventory by product
  const productMatch = pathname.match(
    /^\/api\/inventory\/([^/]+)$/
  );

  if (req.method === "GET" && productMatch) {
    await getInventoryByProductController(
      req,
      res,
      productMatch[1]
    );

    return true;
  }

  return false;
};