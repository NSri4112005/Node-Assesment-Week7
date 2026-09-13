import { IncomingMessage, ServerResponse } from "http";
import {
  createProductController,
  getProductsController,
  getProductController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller";
import {
  authenticate,
  AuthenticatedRequest,
} from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

export const productRoutes = async (
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  queryParams: URLSearchParams
): Promise<boolean> => {
  const authenticatedRequest = req as AuthenticatedRequest;

  // GET /api/products
  if (req.method === "GET" && pathname === "/api/products") {
    if (!authenticate(authenticatedRequest, res)) {
      return true;
    }

    await getProductsController(req, res, queryParams);
    return true;
  }

  // POST /api/products
  if (req.method === "POST" && pathname === "/api/products") {
    if (!authenticate(authenticatedRequest, res)) {
      return true;
    }

    if (!authorizeRoles(authenticatedRequest, res, ["admin"])) {
      return true;
    }

    await createProductController(req, res);
    return true;
  }

  // /api/products/:id
  const productMatch = pathname.match(/^\/api\/products\/([^/]+)$/);

  if (productMatch) {
    const productId = productMatch[1];

    // GET /api/products/:id
    if (req.method === "GET") {
      if (!authenticate(authenticatedRequest, res)) {
        return true;
      }

      await getProductController(req, res, productId);
      return true;
    }

    // PUT /api/products/:id
    if (req.method === "PUT") {
      if (!authenticate(authenticatedRequest, res)) {
        return true;
      }

      if (!authorizeRoles(authenticatedRequest, res, ["admin"])) {
        return true;
      }

      await updateProductController(req, res, productId);
      return true;
    }

    // DELETE /api/products/:id
    if (req.method === "DELETE") {
      if (!authenticate(authenticatedRequest, res)) {
        return true;
      }

      if (!authorizeRoles(authenticatedRequest, res, ["admin"])) {
        return true;
      }

      await deleteProductController(req, res, productId);
      return true;
    }
  }

  return false;
};