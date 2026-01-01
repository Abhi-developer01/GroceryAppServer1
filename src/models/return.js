import mongoose from "mongoose";

const returnRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
  },
  { timestamps: true }
);

/**
 * Prevent duplicate return for same product in same order
 */
returnRequestSchema.index({ order: 1, product: 1 }, { unique: true });

// export default ReturnRequest =
//   mongoose.models.ReturnRequest ||
//   mongoose.model("ReturnRequest", returnRequestSchema);

//   const Product = mongoose.model("Product", productSchema);

const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);
//   mongoose.models.ReturnRequest ||

export default ReturnRequest;
