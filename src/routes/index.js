import { searchRoutes } from "../controllers/product/searchController.js";
import { authRoutes } from "./auth.js";
import { orderRoutes } from "./order.js";
import { categoryRoutes, productRoutes } from "./products.js";
import { returnRoutes } from "./return.js";
import { themeRoutes } from "./theme.js";

const prefix = "/api";

export const registerRoutes = async (fastify) => {
  fastify.register(authRoutes, { prefix: prefix });
  fastify.register(productRoutes, { prefix: prefix });
  fastify.register(categoryRoutes, { prefix: prefix });
  fastify.register(orderRoutes, { prefix: prefix });

  fastify.register(searchRoutes, { prefix: prefix });
  fastify.register(returnRoutes, { prefix: prefix });
  fastify.register(themeRoutes, { prefix: prefix }); // ✅ ADD THIS
};
