import { Inventory } from "../models/inventory.model";
import { Product } from "../models/product.model";
import { StockMovement } from "../models/stock-movement.model";

export interface InventoryReport {
  totalProducts: number;
  totalStock: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  movementSummary: {
    stockIn: number;
    stockOut: number;
    adjustments: number;
    totalMovements: number;
  };
}

export const getInventoryReport = async (): Promise<InventoryReport> => {
  const [products, inventory, movements] = await Promise.all([
    Product.find(),
    Inventory.find(),
    StockMovement.find(),
  ]);

  const productPriceMap = new Map<string, number>();

  for (const product of products) {
    productPriceMap.set(String(product._id), product.price);
  }

  let totalStock = 0;
  let totalInventoryValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const item of inventory) {
    const stock = item.quantity;
    const price = productPriceMap.get(String(item.productId)) ?? 0;

    totalStock += stock;
    totalInventoryValue += stock * price;

    if (stock === 0) {
      outOfStockCount++;
    } else if (stock <= item.reorderLevel) {
      lowStockCount++;
    }
  }

  let stockIn = 0;
  let stockOut = 0;
  let adjustments = 0;

  for (const movement of movements) {
    if (movement.type === "IN") {
      stockIn += movement.quantity;
    } else if (movement.type === "OUT") {
      stockOut += movement.quantity;
    } else if (movement.type === "ADJUSTMENT") {
      adjustments += movement.quantity;
    }
  }

  return {
    totalProducts: products.length,
    totalStock,
    totalInventoryValue,
    lowStockCount,
    outOfStockCount,
    movementSummary: {
      stockIn,
      stockOut,
      adjustments,
      totalMovements: movements.length,
    },
  };
};