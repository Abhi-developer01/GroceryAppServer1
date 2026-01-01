import { uploadReturnImage } from "../controllers/return/return.js";
import { verifyToken } from "../middleware/auth.js";

export const returnRoutes = async (fastify) => {
  fastify.post(
    "/returns/upload-image",
    {
      preHandler: async (request, reply) => {
        await verifyToken(request, reply);

        // ⛔ stop if auth already failed
        if (reply.sent) return;
      },
    },
    uploadReturnImage
  );
};
