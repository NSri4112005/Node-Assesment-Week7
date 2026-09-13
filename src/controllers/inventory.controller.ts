import { IncomingMessage, ServerResponse } from "http";
import {
  addStock,
  adjustStock,
  getInventory,
  getInventoryByProduct,
  getLowStock,
  getStockMovements,
  removeStock,
} from "../services/inventory.service";

const sendJson = (
  res: ServerResponse,
  statusCode: number,
  data: unknown
): void => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  res.end(JSON.stringify(data));
};

const parseBody = async (
  req: IncomingMessage
): Promise<Record<string, unknown>> => {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        const parsed: unknown = JSON.parse(body);

        if (
          typeof parsed !== "object" ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          reject(new Error("Invalid JSON body"));
          return;
        }

        resolve(parsed as Record<string, unknown>);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
};

const getAuthenticatedUserId = (
  req: IncomingMessage
): string | null => {
  const authenticatedRequest = req as IncomingMessage & {
    user?: {
      userId: string;
    };
  };

  return authenticatedRequest.user?.userId ?? null;
};

export const getInventoryController = async (
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> => {
  try {
    const inventory = await getInventory();

    sendJson(res, 200, {
      success: true,
      message: "Inventory fetched successfully",
      data: inventory,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch inventory";

    sendJson(res, 500, {
      success: false,
      message,
    });
  }
};

export const getInventoryByProductController = async (
  _req: IncomingMessage,
  res: ServerResponse,
  productId: string
): Promise<void> => {
  try {
    const inventory = await getInventoryByProduct(productId);

    sendJson(res, 200, {
      success: true,
      message: "Inventory fetched successfully",
      data: inventory,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch inventory";

    const statusCode =
      message === "Product not found" ||
      message === "Invalid product ID"
        ? 404
        : 500;

    sendJson(res, statusCode, {
      success: false,
      message,
    });
  }
};

export const addStockController = async (
  req: IncomingMessage,
  res: ServerResponse,
  productId: string
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      sendJson(res, 401, {
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const body = await parseBody(req);

    const quantity = body.quantity;
    const reason = body.reason;

    if (
      typeof quantity !== "number" ||
      typeof reason !== "string"
    ) {
      sendJson(res, 400, {
        success: false,
        message: "Quantity and reason are required",
      });
      return;
    }

    const inventory = await addStock(
      productId,
      {
        quantity,
        reason,
      },
      userId
    );

    sendJson(res, 200, {
      success: true,
      message: "Stock added successfully",
      data: inventory,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to add stock";

    let statusCode = 500;

    if (
      message === "Invalid product ID" ||
      message === "Product not found"
    ) {
      statusCode = 404;
    } else if (
      message === "Quantity must be greater than 0" ||
      message === "Reason is required" ||
      message === "Invalid JSON body"
    ) {
      statusCode = 400;
    }

    sendJson(res, statusCode, {
      success: false,
      message,
    });
  }
};

export const removeStockController = async (
  req: IncomingMessage,
  res: ServerResponse,
  productId: string
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      sendJson(res, 401, {
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const body = await parseBody(req);

    const quantity = body.quantity;
    const reason = body.reason;

    if (
      typeof quantity !== "number" ||
      typeof reason !== "string"
    ) {
      sendJson(res, 400, {
        success: false,
        message: "Quantity and reason are required",
      });
      return;
    }

    const inventory = await removeStock(
      productId,
      {
        quantity,
        reason,
      },
      userId
    );

    sendJson(res, 200, {
      success: true,
      message: "Stock removed successfully",
      data: inventory,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove stock";

    let statusCode = 500;

    if (
      message === "Invalid product ID" ||
      message === "Product not found"
    ) {
      statusCode = 404;
    } else if (
      message === "Quantity must be greater than 0" ||
      message === "Reason is required" ||
      message === "Invalid JSON body"
    ) {
      statusCode = 400;
    } else if (
      message === "Insufficient stock" ||
      message === "Inventory not found"
    ) {
      statusCode = 409;
    }

    sendJson(res, statusCode, {
      success: false,
      message,
    });
  }
};

export const getStockMovementsController = async (
  _req: IncomingMessage,
  res: ServerResponse,
  productId: string
): Promise<void> => {
  try {
    const movements = await getStockMovements(productId);

    sendJson(res, 200, {
      success: true,
      message: "Stock movement history fetched successfully",
      data: movements,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch stock movements";

    const statusCode =
      message === "Product not found" ||
      message === "Invalid product ID"
        ? 404
        : 500;

    sendJson(res, statusCode, {
      success: false,
      message,
    });
  }
};

export const getLowStockController = async (
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> => {
  try {
    const inventory = await getLowStock();

    sendJson(res, 200, {
      success: true,
      message: "Low stock inventory fetched successfully",
      data: inventory,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch low stock inventory";

    sendJson(res, 500, {
      success: false,
      message,
    });
  }
};

export const adjustStockController = async (
  req: IncomingMessage,
  res: ServerResponse,
  productId: string
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      sendJson(res, 401, {
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const body = await parseBody(req);

    if (
      typeof body.quantity !== "number" ||
      typeof body.reason !== "string"
    ) {
      sendJson(res, 400, {
        success: false,
        message: "Quantity and reason are required",
      });
      return;
    }

    const inventory = await adjustStock(
      productId,
      {
        quantity: body.quantity,
        reason: body.reason,
      },
      userId
    );

    sendJson(res, 200, {
      success: true,
      message: "Stock adjusted successfully",
      data: inventory,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to adjust stock";

    let statusCode = 500;

    if (
      message === "Invalid product ID" ||
      message === "Product not found"
    ) {
      statusCode = 404;
    } else if (
      message === "Quantity cannot be negative" ||
      message === "Reason is required" ||
      message === "Invalid JSON body"
    ) {
      statusCode = 400;
    }

    sendJson(res, statusCode, {
      success: false,
      message,
    });
  }
};