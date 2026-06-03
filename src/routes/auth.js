import {
  addCustomerAddress,
  deleteCustomerAddress,
  fetchUser,
  loginCustomer,
  loginDeliveryPartner,
  phoneEmailLogin,
  refreshToken,
  selectCustomerAddress,
  sendOtp,
  updateCustomerAddress,
  verifyOtp,
} from "../controllers/auth/auth.js";
import { updateUser } from "../controllers/tracking/user.js";
import { verifyToken } from "../middleware/auth.js";

export const authRoutes = async (fastify, options) => {
  fastify.post("/customer/login", loginCustomer);
  fastify.post("/auth/phone-email", phoneEmailLogin);
  fastify.post("/delivery/login", loginDeliveryPartner);
  fastify.post("/refresh-token", refreshToken);
  fastify.get("/user", { preHandler: [verifyToken] }, fetchUser);
  fastify.patch("/user", { preHandler: [verifyToken] }, updateUser);
  fastify.post("/customer/address/add/:customerId", addCustomerAddress);
  fastify.patch(
    "/customer/address/select",
    { preHandler: [verifyToken] },
    selectCustomerAddress,
  );
  fastify.patch(
    "/customer/address/:addressId",
    { preHandler: [verifyToken] },
    updateCustomerAddress,
  );
  fastify.delete(
    "/customer/address/:addressId",
    { preHandler: [verifyToken] },
    deleteCustomerAddress,
  );

  fastify.post("/customer/send-otp", sendOtp);
  fastify.post("/customer/verify-otp", verifyOtp);
};
