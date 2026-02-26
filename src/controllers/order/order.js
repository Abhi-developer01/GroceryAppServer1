import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../../models/order.js";
import Branch from "../../models/branch.js";
import { Customer, DeliveryPartner } from "../../models/user.js";
import Transaction from "../../models/transaction.js";
import Product from "../../models/products.js";

export const createOrder = async (req, reply) => {
  try {
    const { userId } = req.user;
    const { items, branch, totalPrice } = req.body;

    const customerData = await Customer.findById(userId);
    const branchData = await Branch.findById(branch);

    if (!customerData) {
      return reply.status(404).send({ message: "Customer not found" });
    }

    const primaryAddress = customerData.addresses?.[0];

    console.log("PRIMARY ADDRESS →", primaryAddress);
    console.log("DELIVERY SNAPSHOT →", {
      latitude: primaryAddress.latitude,
      longitude: primaryAddress.longitude,
      receiverName: primaryAddress.name,
      receiverPhone: primaryAddress.phone,
    });

    if (!primaryAddress) {
      return reply.status(400).send({ message: "Customer address not found" });
    }

    const newOrder = new Order({
      customer: userId,
      items: items.map((item) => ({
        id: item.id,
        item: item.item,
        count: item.count,
      })),
      branch,
      totalPrice,
      // deliveryLocation: {
      //   latitude: customerData.liveLocation.latitude,
      //   longitude: customerData.liveLocation.longitude,
      //   address: customerData.address || "No address available",
      // },
      deliveryLocation: {
        latitude: primaryAddress.latitude,
        longitude: primaryAddress.longitude,
        address: `${primaryAddress.houseNo}, ${primaryAddress.location}, ${primaryAddress.city}, ${primaryAddress.state}`,
        receiverName: primaryAddress.name, // ✅ from address
        receiverPhone: primaryAddress.phone, // ✅ from address
      },
      pickupLocation: {
        latitude: branchData.location.latitude,
        longitude: branchData.location.longitude,
        address: branchData.address || "No address available",
      },
    });

    console.log(newOrder);

    let savedOrder = await newOrder.save();

    savedOrder = await savedOrder.populate([{ path: "items.item" }]);

    return reply.status(201).send(savedOrder);
  } catch (error) {
    console.log(error);
    return reply.status(500).send({ message: "Failed to create order", error });
  }
};

// export const createTransaction = async (req, res) => {
//   const { amount, userId } = req.body;

//   const razorpay = new Razorpay({
//     key_id: process.env.RAZOR_PAY_KEY_ID,
//     key_secret: process.env.RAZOR_PAY_SECRET,
//   });
//   const options = {
//     amount: amount,
//     currency: "INR",
//     receipt: `receipt#${Date.now()}`,
//   };

//   try {
//     if (!amount || !userId) {
//       return res.status(400).json({
//         success: false,
//         message: "Amount and user id required",
//       });
//     }

//     const razorpayOrder = await razorpay.orders.create(options);

//     res.status(201).json({
//       success: true,
//       message: "Order created successfully",
//       key: process.env.RAZOR_PAY_KEY_ID,
//       amount: razorpayOrder.amount,
//       currency: razorpayOrder.currency,
//       order_id: razorpayOrder.id,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to create order",
//       error: err.message,
//     });
//   }
// };

// const createOrder = async (req, res) => {
//   const {
//     razorpay_order_id,
//     razorpay_payment_id,
//     razorpay_signature,
//     userId,
//     cartItems,
//     deliveryDate,
//     address,
//   } = req.body;

//   const key_secret = process.env.RAZOR_PAY_SECRET;

//   const generated_signature = crypto
//     .createHmac("sha256", key_secret)
//     .update(razorpay_order_id + "|" + razorpay_payment_id)
//     .digest("hex");

//   if (generated_signature === razorpay_signature) {
//     try {
//       const transaction = await Transaction.create({
//         user: userId,
//         orderId: razorpay_order_id,
//         paymentId: razorpay_payment_id,
//         status: "Success",
//         amount: cartItems.reduce(
//           (total, item) => total + item?.quantity * item.price,
//           0
//         ),
//       });

//       const order = await Order.create({
//         user: userId,
//         address,
//         deliveryDate,
//         items: cartItems?.map((item) => ({
//           product: item?._id,
//           quantity: item?.quantity,
//         })),
//         status: "Order Placed",
//       });

//       transaction.order = order._id;
//       await transaction.save();
//       res.json({
//         success: true,
//         message: "Payment Verified and order created",
//         order,
//       });
//     } catch (error) {
//       res.status(500).json({
//         status: "failed",
//         message: "Failed to create transaction or order",
//         error,
//       });
//     }
//   }
// };

export const createTransaction = async (request, reply) => {
  const { amount, userId } = request.body;

  if (!amount || !userId) {
    return reply.code(400).send({
      success: false,
      message: "Amount & user id required",
    });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY_ID,
    key_secret: process.env.RAZOR_PAY_SECRET,
  });

  const options = {
    amount,
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  };

  try {
    const rpOrder = await razorpay.orders.create(options);

    return reply.code(201).send({
      success: true,
      key: process.env.RAZOR_PAY_KEY_ID,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      order_id: rpOrder.id,
    });
  } catch (err) {
    return reply.code(500).send({
      success: false,
      message: "Failed to create transaction",
      error: err.message,
    });
  }
};

// export const paymentSuccess = async (request, reply) => {
//   const {
//     razorpay_order_id,
//     razorpay_payment_id,
//     razorpay_signature,
//     userId,
//     cartItems,
//     deliveryDate,
//     address,
//     branch,
//     userLiveLocation,
//   } = request.body;

//   console.log("📩 Incoming Order Request Body:", req.body);
//   console.log("🛒 Cart Items Received:", req.body.cartItems);

//   try {
//     // Signature Verification
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZOR_PAY_SECRET)
//       .update(razorpay_order_id + "|" + razorpay_payment_id)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       await Transaction.create({
//         user: userId,
//         paymentId: razorpay_payment_id,
//         orderId: razorpay_order_id,
//         status: "Failed",
//         amount: 0,
//       });

//       return reply.code(400).send({
//         success: false,
//         message: "Invalid signature",
//       });
//     }

//     // 🟩 FIX 1: Fetch items by ID from DB to calculate price
//     const itemIds = cartItems.map((i) => i.item);
//     const itemsFromDB = await Product.find({ _id: { $in: itemIds } });

//     const totalAmount = cartItems.reduce((total, cartItem) => {
//       const product = itemsFromDB.find(
//         (p) => p._id.toString() === cartItem.item
//       );
//       return total + cartItem.count * product.price;
//     }, 0);

//     // Create Transaction
//     const trx = await Transaction.create({
//       user: userId,
//       paymentId: razorpay_payment_id,
//       orderId: razorpay_order_id,
//       status: "Success",
//       amount: totalAmount,
//     });

//     // console.log(
//     //   "DEBUG → customerData.liveLocation:",
//     //   customerData.liveLocation
//     // );

//     // 🟩 FIX 2: Correct order.items mapping
//     // const order = await Order.create({
//     //   customer: userId,
//     //   branch: branch || "6766cfc4a1e5940e1c9e9871",
//     //   items: cartItems.map((i) => ({
//     //     id: i.id,
//     //     item: i.item, // already item ID string
//     //     count: i.count,
//     //   })),
//     //   totalPrice: totalAmount,
//     //   deliveryDate,
//     //   deliveryLocation: address,
//     //   status: "available",
//     //   deliveryPartner: null,
//     // });

//     // Fetch customer + branch for correct locations
//     const customerData = await Customer.findById(userId);
//     const branchData = await Branch.findById(branch);
//     console.log("DEBUG → branchData.location:", branchData.location);
//     console.log("DEBUG → address:", address);
//     console.log("DEBUG → customerData:", customerData);
//     console.log("DEBUG → branchData:", branchData);

//     const order = await Order.create({
//       customer: userId,

//       branch: branch, // required
//       status: "available", // needed for Delivery Partner App

//       items: cartItems.map((item) => ({
//         id: item.id,
//         item: item.item,
//         count: item.count,
//       })),

//       totalPrice: totalAmount,
//       deliveryDate,

//       // Delivery Location (customer)
//       // deliveryLocation: {
//       //   latitude: customerData.liveLocation?.latitude,
//       //   longitude: customerData.liveLocation?.longitude,
//       //   address: address || "No address available",
//       // },
//       deliveryLocation: {
//         latitude: userLiveLocation.latitude,
//         longitude: userLiveLocation.longitude,
//         address: userLiveLocation.address,
//       },

//       // Pickup Location (branch)
//       pickupLocation: {
//         latitude: branchData.location.latitude,
//         longitude: branchData.location.longitude,
//         address: branchData.address || "No address available",
//       },

//       deliveryPartner: null,
//     });

//     trx.order = order._id;
//     await trx.save();

//     return reply.code(200).send({
//       success: true,
//       message: "Payment Verified and Order Created",
//       order,
//       transaction: trx,
//     });
//   } catch (error) {
//     console.log("Payment success error", error);
//     return reply.code(500).send({
//       success: false,
//       message: "Server Error",
//       error: error.message,
//     });
//   }
// };

export const paymentSuccess = async (request, reply) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      cartItems,
      deliveryDate,
      address,
      branch,
      userLiveLocation,
    } = request.body;

    console.log("📩 Incoming Payment Body:", request.body);

    // ------------------------------
    // 1️⃣ BASIC VALIDATION
    // ------------------------------
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return reply.code(400).send({
        success: false,
        message: "Missing Razorpay payment fields",
      });
    }

    if (!userId || !cartItems || cartItems.length === 0) {
      return reply.code(400).send({
        success: false,
        message: "User or cart data missing",
      });
    }

    if (!branch) {
      return reply.code(400).send({
        success: false,
        message: "Branch is required",
      });
    }

    if (!userLiveLocation) {
      return reply.code(400).send({
        success: false,
        message: "User live location missing",
      });
    }

    // ------------------------------
    // 2️⃣ VERIFY SIGNATURE
    // ------------------------------
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZOR_PAY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await Transaction.create({
        user: userId,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: "Failed",
        amount: 0,
      });

      return reply.code(400).send({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // ------------------------------
    // 3️⃣ FETCH PRODUCTS
    // ------------------------------
    const itemIds = cartItems.map((i) => i.item);
    const itemsFromDB = await Product.find({ _id: { $in: itemIds } });

    if (!itemsFromDB.length) {
      return reply.code(400).send({
        success: false,
        message: "Products not found in database",
      });
    }

    // ------------------------------
    // 4️⃣ CALCULATE TOTAL
    // ------------------------------
    let totalAmount = 0;

    cartItems.forEach((cartItem) => {
      const dbItem = itemsFromDB.find(
        (p) => p._id.toString() === cartItem.item,
      );

      if (!dbItem) return;

      const price = dbItem.discountPrice || dbItem.price;
      totalAmount += price * cartItem.count;

      //      const price = dbItem.price; // ✅ selling price only
      // itemsTotal += price * cartItem.count;
    });

    //     const handlingCharge = 7;
    // const deliveryCharge = itemsTotal < 200 ? 30 : 0;

    // const totalAmount = itemsTotal + handlingCharge + deliveryCharge;

    // ------------------------------
    // 5️⃣ CREATE TRANSACTION
    // ------------------------------
    const trx = await Transaction.create({
      user: userId,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: "Success",
      amount: totalAmount,
    });

    // ------------------------------
    // 6️⃣ FETCH USER + BRANCH
    // ------------------------------
    const customerData = await Customer.findById(userId);
    const branchData = await Branch.findById(branch);

    if (!customerData) {
      return reply.code(404).send({
        success: false,
        message: "Customer not found",
      });
    }

    if (!branchData || !branchData.location) {
      return reply.code(404).send({
        success: false,
        message: "Branch or branch location not found",
      });
    }

    // ------------------------------
    // 7️⃣ CREATE ORDER
    // ------------------------------
    const order = await Order.create({
      customer: userId,
      branch,
      status: "available",

      items: cartItems.map((item) => ({
        id: item.id,
        item: item.item,
        count: item.count,
      })),

      totalPrice: totalAmount,
      deliveryDate,

      // deliveryLocation: {
      //   latitude: userLiveLocation.latitude,
      //   longitude: userLiveLocation.longitude,
      //   address: userLiveLocation.address || "No address provided",
      // },

      deliveryLocation: {
        latitude: address.latitude,
        longitude: address.longitude,
        address: `${address.houseNo}, ${address.location}, ${address.city}, ${address.state}`,
        receiverName: address.name, // 🔥 THIS WAS MISSING
        receiverPhone: address.phone, // 🔥 THIS WAS MISSING
      },

      pickupLocation: {
        latitude: branchData.location.latitude,
        longitude: branchData.location.longitude,
        address: branchData.address || "Branch address missing",
      },

      deliveryPartner: null,
    });

    // // 🔔 REAL-TIME EVENT: Notify delivery partners
    // const io = request.server.io; // Fastify socket reference

    // io.to(branch.toString()).emit("new-order", {
    //   orderId: order.orderId,
    //   _id: order._id,
    //   branch: order.branch,
    //   totalPrice: order.totalPrice,
    //   deliveryLocation: order.deliveryLocation,
    //   status: order.status,
    //   createdAt: order.createdAt,
    // });

    // 🔔 REAL-TIME EVENT: Notify delivery partners
    const io = request.server.io;

    console.log("📡 [SOCKET] Emitting new-order event", {
      branch: branch.toString(),
      orderId: order.orderId,
      _id: order._id,
    });

    io.to(branch.toString()).emit("new-order", {
      orderId: order.orderId,
      _id: order._id,
      branch: order.branch,
      totalPrice: order.totalPrice,
      deliveryLocation: order.deliveryLocation,
      status: order.status,
      createdAt: order.createdAt,
    });

    console.log("✅ [SOCKET] new-order emitted successfully");

    for (const cartItem of cartItems) {
      await Product.findByIdAndUpdate(cartItem.item, {
        $inc: { stock: -cartItem.count },
      });
    }

    // ------------------------------
    // 8️⃣ LINK TRANSACTION → ORDER
    // ------------------------------
    trx.order = order._id;
    await trx.save();

    // ------------------------------
    // 9️⃣ RESPONSE
    // ------------------------------
    return reply.code(200).send({
      success: true,
      message: "Payment Verified & Order Created Successfully",
      order,
      transaction: trx,
    });
  } catch (error) {
    console.error("🔥 Payment Success Error:", error);
    return reply.code(500).send({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const confirmOrder = async (req, reply) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.user;
    const { deliveryPersonLocation } = req.body;

    const deliveryPerson = await DeliveryPartner.findById(userId);
    if (!deliveryPerson) {
      return reply.status(404).send({ message: "Delivery Person not found" });
    }
    const order = await Order.findById(orderId);
    if (!order) return reply.status(404).send({ message: "Order not found" });

    if (order.status !== "available") {
      return reply.status(400).send({ message: "Order is not available" });
    }

    order.status = "confirmed";

    order.deliveryPartner = userId;
    // order.deliveryPersonLocation = {
    //   latitude: deliveryPersonLocation?.latitude,
    //   longitude: deliveryPersonLocation?.longitude,
    //   address: deliveryPersonLocation?.address || "",
    // };
    // ADD THIS → Set pickup location if missing
    if (!order.pickupLocation || !order.pickupLocation.latitude) {
      order.pickupLocation = {
        latitude: 27.9001,
        longitude: 79.9205,
        address: "Store / Warehouse",
      };
    }

    // ADD THIS → Set delivery (customer) location if missing
    if (!order.deliveryLocation || !order.deliveryLocation.latitude) {
      order.deliveryLocation = {
        latitude: 27.897,
        longitude: 79.923,
        address: "Customer Delivery Location",
      };
    }

    // UPDATE delivery person current location
    order.deliveryPersonLocation = {
      latitude: deliveryPersonLocation?.latitude ?? 0,
      longitude: deliveryPersonLocation?.longitude ?? 0,
      address: deliveryPersonLocation?.address || "Rider Current Location",
    };
    req.server.io.to(orderId).emit("orderConfirmed", order);
    await order.save();
    console.log("🚚 CONFIRMED ORDER →", JSON.stringify(order, null, 2));

    return reply.send(order);
  } catch (error) {
    console.log(error);
    return reply
      .status(500)
      .send({ message: "Failed to confirm order", error });
  }
};

// export const updateOrderStatus = async (req, reply) => {
//   try {
//     const { orderId } = req.params;
//     const { status, deliveryPersonLocation } = req.body;

//     const { userId } = req.user;

//     const deliveryPerson = await DeliveryPartner.findById(userId);
//     if (!deliveryPerson) {
//       return reply.status(404).send({ message: "Delivery Person not found" });
//     }
//     const order = await Order.findById(orderId);
//     if (!order) return reply.status(404).send({ message: "Order not found" });

//     if (["cancelled", "delivered"].includes(order.status)) {
//       return reply.status(400).send({ message: "Order cannot be updated" });
//     }
//     if (order.deliveryPartner.toString() !== userId) {
//       return reply.status(403).send({ message: "Unauthorized" });
//     }
//     order.status = status;
//     order.deliveryPersonLocation = deliveryPersonLocation;
//     await order.save();

//     req.server.io.to(orderId).emit("LiveTrackingUpdates", order);
//     return reply.send(order);
//   } catch (error) {
//     return reply
//       .status(500)
//       .send({ message: "Failed to update order status", error });
//   }
// };

// export const updateOrderStatus = async (req, reply) => {
//   try {
//     const { orderId } = req.params;
//     const { status, deliveryPersonLocation } = req.body;
//     const { userId } = req.user;

//     const deliveryPerson = await DeliveryPartner.findById(userId);
//     if (!deliveryPerson) {
//       return reply.status(404).send({ message: "Delivery Person not found" });
//     }

//     const order = await Order.findById(orderId);
//     if (!order) return reply.status(404).send({ message: "Order not found" });

//     if (["cancelled", "delivered"].includes(order.status)) {
//       return reply.status(400).send({ message: "Order cannot be updated" });
//     }

//     if (order.deliveryPartner.toString() !== userId) {
//       return reply.status(403).send({ message: "Unauthorized" });
//     }

//     order.status = status;

//     if (deliveryPersonLocation) {
//       order.deliveryPersonLocation = {
//         latitude: deliveryPersonLocation.latitude || 0,
//         longitude: deliveryPersonLocation.longitude || 0,
//         address: deliveryPersonLocation.address || "No location data",
//       };
//     }

//     await order.save();

//     req.server.io.to(orderId).emit("LiveTrackingUpdates", order);
//     return reply.send(order);
//   } catch (error) {
//     return reply
//       .status(500)
//       .send({ message: "Failed to update order status", error });
//   }
// };

export const updateOrderStatus = async (req, reply) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryPersonLocation } = req.body;
    const { userId } = req.user;

    console.log("🟢 updateOrderStatus called →", {
      orderId,
      userId,
      status,
      deliveryPersonLocation,
    });

    console.log("📡 Incoming location:", deliveryPersonLocation);

    // 1️⃣ Check if delivery partner exists
    const deliveryPerson = await DeliveryPartner.findById(userId);
    if (!deliveryPerson) {
      console.log("❌ Delivery Partner not found:", userId);
      return reply.status(404).send({ message: "Delivery Partner not found" });
    }

    // 2️⃣ Fetch order
    const order = await Order.findById(orderId);
    if (!order) {
      console.log("❌ Order not found:", orderId);
      return reply.status(404).send({ message: "Order not found" });
    }

    // 3️⃣ Prevent updates on finalized orders
    if (["cancelled", "delivered"].includes(order.status)) {
      console.log("⚠️ Order cannot be updated:", order.status);
      return reply.status(400).send({ message: "Order cannot be updated" });
    }

    // 4️⃣ Validate delivery partner ownership
    if (!order.deliveryPartner || order.deliveryPartner.toString() !== userId) {
      console.log("🚫 Unauthorized update attempt by:", userId);
      return reply.status(403).send({ message: "Unauthorized" });
    }

    // 5️⃣ Update order status
    order.status = status;

    // 6️⃣ Update location if provided
    if (deliveryPersonLocation) {
      order.deliveryPersonLocation = {
        latitude: deliveryPersonLocation.latitude ?? 0,
        longitude: deliveryPersonLocation.longitude ?? 0,
        address: deliveryPersonLocation.address || "No location data",
      };
    }

    // 7️⃣ Save changes
    await order.save();

    // 8️⃣ Emit socket update
    req.server.io.to(orderId).emit("LiveTrackingUpdates", order);

    console.log("✅ Order status updated successfully:", order.status);

    // 9️⃣ Return updated order
    return reply.send(order);
  } catch (error) {
    console.error("💥 updateOrderStatus error →", error);
    return reply
      .status(500)
      .send({ message: "Failed to update order status", error });
  }
};

export const getOrders = async (req, reply) => {
  try {
    const { status, customerId, deliveryPartnerId, branchId } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }
    if (customerId) {
      query.customer = customerId;
    }
    if (deliveryPartnerId) {
      query.deliveryPartner = deliveryPartnerId;
      query.branch = branchId;
    }
    const orders = await Order.find(query).populate(
      "customer branch items.item deliveryPartner",
    );
    return reply.send(orders);
  } catch (error) {
    return reply
      .status(500)
      .send({ message: "Failed to retrieve order", error });
  }
};

export const getOrderById = async (req, reply) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate(
      "customer branch items.item deliveryPartner",
    );
    if (!order) {
      return reply.status(404).send({ message: "Order not found" });
    }

    return reply.send(order);
  } catch (error) {
    return reply
      .status(500)
      .send({ message: "Failed to retrieve order", error });
  }
};
