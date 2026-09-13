import { IncomingMessage, ServerResponse } from "http";
import {
  createProduct,
  getProductById,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../services/product.service";
import {
  CreateProductInput,
  ProductQuery,
  UpdateProductInput,
} from "../types/product.types";

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

const parseBody = (req: IncomingMessage): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
};

const getErrorStatus = (message: string): number => {
  if (message === "Product not found") {
    return 404;
  }

  if (message === "SKU already exists") {
    return 409;
  }

  if (message.includes("Cast to ObjectId failed")) {
    return 400;
  }

  return 400;
};

export const createProductController = async (
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> => {
  try {
    const body = (await parseBody(req)) as CreateProductInput;

    if (
      !body.name ||
      !body.sku ||
      !body.category ||
      typeof body.price !== "number"
    ) {
      sendJson(res, 400, {
        success: false,
        message: "Name, SKU, category and valid price are required",
      });
      return;
    }

    if (body.price < 0) {
      sendJson(res, 400, {
        success: false,
        message: "Price cannot be negative",
      });
      return;
    }

    if (
      body.reorderLevel !== undefined &&
      (typeof body.reorderLevel !== "number" ||
        body.reorderLevel < 0)
    ) {
      sendJson(res, 400, {
        success: false,
        message: "Reorder level must be a non-negative number",
      });
      return;
    }

    const product = await createProduct(body);

    sendJson(res, 201, {
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create product";

    sendJson(res, getErrorStatus(message), {
      success: false,
      message,
    });
  }
};

export const getProductsController = async (
  _req: IncomingMessage,
  res: ServerResponse,
  queryParams: URLSearchParams
): Promise<void> => {
  try {
    const pageValue = Number(queryParams.get("page") || "1");
    const limitValue = Number(queryParams.get("limit") || "10");

    const page =
      Number.isInteger(pageValue) && pageValue > 0
        ? pageValue
        : 1;

    const limit =
      Number.isInteger(limitValue) &&
      limitValue > 0 &&
      limitValue <= 100
        ? limitValue
        : 10;

    const stockValue = queryParams.get("stock");

    const stock =
      stockValue === "low" || stockValue === "out"
        ? stockValue
        : undefined;

    const sortValue = queryParams.get("sort");

    const sort =
      sortValue === "price_asc" ||
      sortValue === "price_desc" ||
      sortValue === "stock_asc"
        ? sortValue
        : undefined;

    const query: ProductQuery = {
      search: queryParams.get("search") || undefined,
      category: queryParams.get("category") || undefined,
      stock,
      sort,
      page,
      limit,
    };

    const result = await getProducts(query);

    sendJson(res, 200, {
      success: true,
      message: "Products fetched successfully",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch products";

    sendJson(res, 500, {
      success: false,
      message,
    });
  }
};

export const getProductController = async (
  _req: IncomingMessage,
  res: ServerResponse,
  productId: string
): Promise<void> => {
  try {
    const product = await getProductById(productId);

    sendJson(res, 200, {
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch product";

    sendJson(res, getErrorStatus(message), {
      success: false,
      message,
    });
  }
};

export const updateProductController = async (
  req: IncomingMessage,
  res: ServerResponse,
  productId: string
): Promise<void> => {
  try {
    const body = (await parseBody(req)) as UpdateProductInput;

    if (
      body.price !== undefined &&
      (typeof body.price !== "number" || body.price < 0)
    ) {
      sendJson(res, 400, {
        success: false,
        message: "Price must be a non-negative number",
      });
      return;
    }

    if (
      body.reorderLevel !== undefined &&
      (typeof body.reorderLevel !== "number" ||
        body.reorderLevel < 0)
    ) {
      sendJson(res, 400, {
        success: false,
        message: "Reorder level must be a non-negative number",
      });
      return;
    }

    const product = await updateProduct(productId, body);

    sendJson(res, 200, {
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update product";

    sendJson(res, getErrorStatus(message), {
      success: false,
      message,
    });
  }
};

export const deleteProductController = async (
  _req: IncomingMessage,
  res: ServerResponse,
  productId: string
): Promise<void> => {
  try {
    await deleteProduct(productId);

    sendJson(res, 200, {
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete product";

    sendJson(res, getErrorStatus(message), {
      success: false,
      message,
    });
  }
};