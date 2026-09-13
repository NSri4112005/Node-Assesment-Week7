import { Readable } from "stream";
import { Inventory } from "../models/inventory.model";
import { Product } from "../models/product.model";

const escapeCsvValue = (value: string | number): string => {
  const text = String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

export const createInventoryCsvStream = (): Readable => {
  return Readable.from(
    (async function* (): AsyncGenerator<string> {
      yield "Product ID,Product Name,SKU,Category,Price,Stock,Reorder Level,Inventory Value\n";

      const cursor = Inventory.find().cursor();

      for await (const inventory of cursor) {
        const product = await Product.findById(inventory.productId);

        if (!product) {
          continue;
        }

        const inventoryValue = inventory.quantity * product.price;

        const row = [
          String(product._id),
          product.name,
          product.sku,
          product.category,
          product.price,
          inventory.quantity,
          inventory.reorderLevel,
          inventoryValue,
        ]
          .map(escapeCsvValue)
          .join(",");

        yield `${row}\n`;
      }
    })()
  );
};