import { Product } from "../models/product.model";
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQuery,
  ProductResponse,
  PaginationMeta,
} from "../types/product.types";

const toProductResponse = (product: {
  _id: unknown;
  name: string;
  sku: string;
  description?: string;
  price: number;
  category: string;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
}): ProductResponse => {
  return {
    id: String(product._id),
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: product.price,
    category: product.category,
    reorderLevel: product.reorderLevel,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

export const createProduct = async (
  input: CreateProductInput
): Promise<ProductResponse> => {
  const existingProduct = await Product.findOne({
    sku: input.sku.toUpperCase(),
  });

  if (existingProduct) {
    throw new Error("SKU already exists");
  }

  const product = await Product.create({
    name: input.name.trim(),
    sku: input.sku.toUpperCase().trim(),
    description: input.description?.trim(),
    price: input.price,
    category: input.category.trim(),
    reorderLevel: input.reorderLevel ?? 10,
  });

  return toProductResponse(product);
};

export const getProductById = async (
  productId: string
): Promise<ProductResponse> => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  return toProductResponse(product);
};

export const updateProduct = async (
  productId: string,
  input: UpdateProductInput
): Promise<ProductResponse> => {
  if (input.sku) {
    const existingProduct = await Product.findOne({
      sku: input.sku.toUpperCase().trim(),
      _id: { $ne: productId },
    });

    if (existingProduct) {
      throw new Error("SKU already exists");
    }
  }

  const updateData: UpdateProductInput = {
    ...input,
    ...(input.sku
      ? { sku: input.sku.toUpperCase().trim() }
      : {}),
    ...(input.name ? { name: input.name.trim() } : {}),
    ...(input.category
      ? { category: input.category.trim() }
      : {}),
    ...(input.description !== undefined
      ? { description: input.description.trim() }
      : {}),
  };

  const product = await Product.findByIdAndUpdate(
    productId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!product) {
    throw new Error("Product not found");
  }

  return toProductResponse(product);
};

export const deleteProduct = async (
  productId: string
): Promise<void> => {
  const product = await Product.findByIdAndDelete(productId);

  if (!product) {
    throw new Error("Product not found");
  }
};

export const getProducts = async (
  query: ProductQuery
): Promise<{
  data: ProductResponse[];
  pagination: PaginationMeta;
}> => {
  const {
    search,
    category,
    page = 1,
    limit = 10,
  } = query;

  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  const skip = (page - 1) * limit;

  let productsQuery = Product.find(filter);

  if (query.sort === "price_asc") {
    productsQuery = productsQuery.sort({ price: 1 });
  } else if (query.sort === "price_desc") {
    productsQuery = productsQuery.sort({ price: -1 });
  } else if (query.sort === "stock_asc") {
    // Stock sorting will be handled after Inventory integration.
    productsQuery = productsQuery.sort({ name: 1 });
  } else {
    productsQuery = productsQuery.sort({ createdAt: -1 });
  }

  const [products, total] = await Promise.all([
    productsQuery.skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return {
    data: products.map(toProductResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};