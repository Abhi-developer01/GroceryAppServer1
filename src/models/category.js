import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  subcategories: [subcategorySchema],
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
