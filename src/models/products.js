import mongoose from "mongoose";

// 1. Define the Variant Sub-schema
const variantSchema = new mongoose.Schema({
  image: { type: String, required: true },
  unit: { type: String, required: true }, // e.g., "500g", "1 kg", "250ml", "1 pc"
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  isDefault: { type: Boolean, default: false }, // Useful to show the default selected variant on UI
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    quantity: { type: String, required: true },

    // 🆕 STOCK (number of packets)
    stock: {
      type: Number,
      required: true,
      default: 0, // prevents undefined issues
      min: 0, // no negative stock
    },

    // 🆕 HAS VARIANTS FLAG
    hasVariants: { type: Boolean, default: false },

    // 🆕 VARIANTS ARRAY
    variants: [variantSchema],

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId, // <-- Refers to subcategory inside category
      // ref: "Subcategory",
      required: false,
    },

    // ✅ Add this safely at the bottom (NOT required, so it won't break old grocery items)
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: false,
    },
  },
  // { timestamps: true },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
