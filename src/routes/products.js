import { getAllCategories } from "../controllers/product/category.js";
import {
  getProductsByCategoryId,
  getProductsByRestaurantId,
} from "../controllers/product/product.js";
import { getProductsBySubcategoryId } from "../controllers/product/product.js";

export const categoryRoutes = async (fastify, options) => {
  fastify.get("/categories", getAllCategories);
};

export const productRoutes = async (fastify, options) => {
  fastify.get("/products/:categoryId", getProductsByCategoryId);

  fastify.get(
    "/products/subcategory/:subcategoryId",
    getProductsBySubcategoryId,
  );

  // ✅ ADD THIS: Route to fetch food items for a restaurant
  fastify.get("/products/restaurant/:restaurantId", getProductsByRestaurantId);
};
