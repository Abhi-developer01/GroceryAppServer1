import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    action: {
      type: String,
      enum: ["ADD", "SALE", "REMOVE", "RETURN", "DAMAGE"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    previousStock: {
      type: Number,
      required: true,
    },

    newStock: {
      type: Number,
      required: true,
    },

    note: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const InventoryLog = mongoose.model("InventoryLog", inventoryLogSchema);

export default InventoryLog;
