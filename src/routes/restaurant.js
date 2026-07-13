import { getAllRestaurants } from "../controllers/restaurant/restaurant.js"; // Adjust path based on your folder structure

export const restaurantRoutes = async (fastify, options) => {
  fastify.get("/restaurants", getAllRestaurants);
};
