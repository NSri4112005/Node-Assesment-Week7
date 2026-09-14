import mongoose from "mongoose";
import { Inventory } from "../models/inventory.model";
import { Product } from "../models/product.model";
import { StockMovement } from "../models/stock-movement.model";
import {
  AddStockInput,
  RemoveStockInput,
  InventoryResponse,
  StockMovementResponse,
} from "../types/inventory.types";

const toInventoryResponse = (inventory: {
  _id: unknown;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
}): InventoryResponse => {
  return {
    id: String(inventory._id),
    productId: String(inventory.productId),
    quantity: inventory.quantity,
    reorderLevel: inventory.reorderLevel,
    createdAt: inventory.createdAt,
    updatedAt: inventory.updatedAt,
  };
};

const toMovementResponse = (movement: {
  _id: unknown;
  productId: mongoose.Types.ObjectId;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}): StockMovementResponse => {
  return {
    id: String(movement._id),
    productId: String(movement.productId),
    type: movement.type,
    quantity: movement.quantity,
    previousStock: movement.previousStock,
    newStock: movement.newStock,
    reason: movement.reason,
    userId: String(movement.userId),
    createdAt: movement.createdAt,
  };
};

const validateQuantity = (quantity: number): void => {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }
};

const validateProduct = async (
  productId: string
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }
};

export const getInventory = async (): Promise<InventoryResponse[]> => {
  const inventory = await Inventory.find().sort({ createdAt: -1 });

  return inventory.map(toInventoryResponse);
};

export const getInventoryByProduct = async (
  productId: string
): Promise<InventoryResponse> => {
  await validateProduct(productId);

  let inventory = await Inventory.findOne({ productId });

  if (!inventory) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    inventory = await Inventory.create({
      productId,
      quantity: 0,
      reorderLevel: product.reorderLevel,
    });
  }

  return toInventoryResponse(inventory);
};

export const addStock = async (
  productId: string,
  input: AddStockInput,
  userId: string
): Promise<InventoryResponse> => {
  await validateProduct(productId);
  validateQuantity(input.quantity);

  if (!input.reason.trim()) {
    throw new Error("Reason is required");
  }

  const inventory = await Inventory.findOneAndUpdate(
    { productId },
    {
      $inc: { quantity: input.quantity },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  if (!inventory) {
    throw new Error("Unable to update inventory");
  }

  const previousStock = inventory.quantity - input.quantity;

  await StockMovement.create({
    productId,
    type: "IN",
    quantity: input.quantity,
    previousStock,
    newStock: inventory.quantity,
    reason: input.reason.trim(),
    userId,
  });

  return toInventoryResponse(inventory);
};

export const removeStock = async (
  productId: string,
  input: RemoveStockInput,
  userId: string
): Promise<InventoryResponse> => {
  await validateProduct(productId);
  validateQuantity(input.quantity);

  if (!input.reason.trim()) {
    throw new Error("Reason is required");
  }

  const inventory = await Inventory.findOneAndUpdate(
    {
      productId,
      quantity: { $gte: input.quantity },
    },
    {
      $inc: { quantity: -input.quantity },
    },
    {
      new: true,
    }
  );

  if (!inventory) {
    const existingInventory = await Inventory.findOne({ productId });

    if (!existingInventory) {
      throw new Error("Inventory not found");
    }

    throw new Error("Insufficient stock");
  }

  const previousStock = inventory.quantity + input.quantity;

  await StockMovement.create({
    productId,
    type: "OUT",
    quantity: input.quantity,
    previousStock,
    newStock: inventory.quantity,
    reason: input.reason.trim(),
    userId,
  });

  return toInventoryResponse(inventory);
};

export const getStockMovements = async (
  productId: string
): Promise<StockMovementResponse[]> => {
  await validateProduct(productId);

  const movements = await StockMovement.find({
    productId,
  }).sort({ createdAt: -1 });

  return movements.map(toMovementResponse);
};

export const getLowStock = async (): Promise<InventoryResponse[]> => {
  const inventory = await Inventory.find({
    $expr: {
      $lte: ["$quantity", "$reorderLevel"],
    },
  }).sort({ quantity: 1 });

  return inventory.map(toInventoryResponse);
};

export const adjustStock = async (
  productId: string,
  input: {
    quantity: number;
    reason: string;
  },
  userId: string
): Promise<InventoryResponse> => {
  await validateProduct(productId);

  if (
    !Number.isFinite(input.quantity) ||
    input.quantity < 0
  ) {
    throw new Error("Quantity cannot be negative");
  }

  if (!input.reason.trim()) {
    throw new Error("Reason is required");
  }

  const session = await mongoose.startSession();

  try {
    let updatedInventory: InventoryResponse | null = null;

    await session.withTransaction(async () => {
      let inventory = await Inventory.findOne({
        productId,
      }).session(session);

      if (!inventory) {
        const product = await Product.findById(productId).session(session);

        if (!product) {
          throw new Error("Product not found");
        }

        const created = await Inventory.create(
          [
            {
              productId,
              quantity: 0,
              reorderLevel: product.reorderLevel,
            },
          ],
          { session }
        );

        inventory = created[0];
      }

      const previousStock = inventory.quantity;

      inventory.quantity = input.quantity;

      await inventory.save({ session });

      const movement = await StockMovement.create(
        [
          {
            productId,
            type: "ADJUSTMENT",
            quantity: Math.abs(
              input.quantity - previousStock
            ),
            previousStock,
            newStock: input.quantity,
            reason: input.reason.trim(),
            userId,
          },
        ],
        { session }
      );

      if (!movement[0]) {
        throw new Error("Failed to create stock movement");
      }

      updatedInventory = toInventoryResponse(inventory);
    });

    if (!updatedInventory) {
      throw new Error("Failed to adjust inventory");
    }

    return updatedInventory;
  } finally {
    await session.endSession();
  }
};