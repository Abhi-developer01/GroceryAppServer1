import Order from "../../models/order.js";
import ReturnRequest from "../../models/return.js";

export const uploadReturnImage = async (req, reply) => {
  try {
    const { orderId, productId, reason, imageUrl, publicId } = req.body;
    const customerId = req.user.userId;

    console.log("Request body:", req.body);
    console.log("Customer ID:", customerId);

    if (!orderId || !productId || !imageUrl || !publicId) {
      return reply.code(400).send({ message: "Missing required fields" });
    }

    // 1️⃣ Verify order belongs to customer
    const order = await Order.findOne({
      _id: orderId,
      customer: customerId,
    }).lean(); // use lean() to get plain JS object

    console.log("Fetched order:", order);

    if (!order) {
      return reply.code(404).send({ message: "Order not found" });
    }

    // 2️⃣ Verify product exists in order
    console.log("Order items:", order.items);
    // const productExists = order.items.some(
    //   (item) =>
    //     item.id?.toString() === productId || item.item?.toString() === productId
    // );
    const productExists = order.items.some(
      (item) =>
        item.id?.toString() === productId ||
        item.item?._id?.toString() === productId ||
        item.item?.toString() === productId
    );

    console.log("Product exists in order?", productExists);

    if (!productExists) {
      return reply.code(400).send({
        message: "Product not found in this order",
      });
    }

    // 3️⃣ Create return request
    await ReturnRequest.create({
      customer: customerId,
      order: orderId,
      product: productId,
      reason,
      images: [{ url: imageUrl, publicId }],
    });

    return reply.send({
      message: "✅ Return request submitted successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return reply.code(409).send({
        message: "Return already requested for this product",
      });
    }

    console.error("🔥 Return error:", error);
    return reply.code(500).send({
      message: "Failed to create return request",
    });
  }
};
