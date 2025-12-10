import {
  addCustomerAddress,
  fetchUser,
  loginCustomer,
  loginDeliveryPartner,
  refreshToken,
  sendOtp,
  verifyOtp,
} from "../controllers/auth/auth.js";
import { updateUser } from "../controllers/tracking/user.js";
import { verifyToken } from "../middleware/auth.js";

export const authRoutes = async (fastify, options) => {
  fastify.post("/customer/login", loginCustomer);
  fastify.post("/delivery/login", loginDeliveryPartner);
  fastify.post("/refresh-token", refreshToken);
  fastify.get("/user", { preHandler: [verifyToken] }, fetchUser);
  fastify.patch("/user", { preHandler: [verifyToken] }, updateUser);
  fastify.post("/customer/address/add/:customerId", addCustomerAddress);

  fastify.post("/customer/send-otp", sendOtp);
  fastify.post("/customer/verify-otp", verifyOtp);
};
