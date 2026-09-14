import { Product } from "../models/product.model";
import { Inventory } from "../models/inventory.model";
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQuery,
  ProductResponse,
  PaginationMeta,
} from "../types/product.types";

interface ProductDocument {
  _id: unknown;
  name: string;
  sku: string;
  description?: string;
  price: number;
  category: string;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductWithStock extends ProductDocument {
  stock: number;
}

const toProductResponse = (
  product: ProductDocument,
  stock?: number
): ProductResponse => {
  return {
    id: String(product._id),
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: product.price,
    category: product.category,
    reorderLevel: product.reorderLevel,
    ...(stock !== undefined ? { stock } : {}),
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

  const inventory = await Inventory.findOne({
    productId: product._id,
  });

  return toProductResponse(
    product,
    inventory?.quantity ?? 0
  );
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
    ...(input.name
      ? { name: input.name.trim() }
      : {}),
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

  const inventory = await Inventory.findOne({
    productId: product._id,
  });

  return toProductResponse(
    product,
    inventory?.quantity ?? 0
  );
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
    stock,
    page = 1,
    limit = 10,
  } = query;

  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        sku: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (category) {
    filter.category = category;
  }

  const products = await Product.find(filter);

  const inventoryRecords = await Inventory.find();

  const stockMap = new Map<string, number>();

  for (const inventory of inventoryRecords) {
    stockMap.set(
      String(inventory.productId),
      inventory.quantity
    );
  }

  let productsWithStock: ProductWithStock[] = products.map(
    (product) => ({
      _id: product._id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price,
      category: product.category,
      reorderLevel: product.reorderLevel,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      stock:
        stockMap.get(String(product._id)) ?? 0,
    })
  );

  if (stock === "low") {
    productsWithStock = productsWithStock.filter(
      (product) =>
        product.stock > 0 &&
        product.stock <= product.reorderLevel
    );
  }

  if (stock === "out") {
    productsWithStock = productsWithStock.filter(
      (product) => product.stock === 0
    );
  }

  if (query.sort === "price_asc") {
    productsWithStock.sort(
      (a, b) => a.price - b.price
    );
  } else if (query.sort === "price_desc") {
    productsWithStock.sort(
      (a, b) => b.price - a.price
    );
  } else if (query.sort === "stock_asc") {
    productsWithStock.sort(
      (a, b) => a.stock - b.stock
    );
  } else {
    productsWithStock.sort(
      (a, b) =>
        b.createdAt.getTime() -
        a.createdAt.getTime()
    );
  }

  const total = productsWithStock.length;

  const skip = (page - 1) * limit;

  const paginatedProducts =
    productsWithStock.slice(
      skip,
      skip + limit
    );

  return {
    data: paginatedProducts.map((product) =>
      toProductResponse(
        product,
        product.stock
      )
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};