import mongoose, { Document, Model, Schema } from "mongoose";

export interface IInventory extends Document {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      required: true,
      min: 0,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

export const Inventory: Model<IInventory> =
  mongoose.model<IInventory>("Inventory", inventorySchema);