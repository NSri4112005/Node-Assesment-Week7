export interface AddStockInput {
  quantity: number;
  reason: string;
}

export interface RemoveStockInput {
  quantity: number;
  reason: string;
}

export interface AdjustStockInput {
  quantity: number;
  reason: string;
}

export interface InventoryResponse {
  id: string;
  productId: string;
  quantity: number;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovementResponse {
  id: string;
  productId: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  userId: string;
  createdAt: Date;
}