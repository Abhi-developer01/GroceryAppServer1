import { Customer, DeliveryPartner } from "../../models/user.js";
import jwt from "jsonwebtoken";

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" },
  );
  const refreshToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
};

export const loginCustomer = async (req, reply) => {
  try {
    const { phone } = req.body;
    let customer = await Customer.findOne({ phone });

    if (!customer) {
      customer = new Customer({
        phone,
        role: "Customer",
        isActivated: true,
      });

      await customer.save();
    }
    const { accessToken, refreshToken } = generateTokens(customer);

    return reply.send({
      message: "Login Successful",
      accessToken,
      refreshToken,
      customer,
    });
  } catch (error) {
    return reply.status(500).send({ message: "An error occurred", error });
  }
};

export const addCustomerAddress = async (req, reply) => {
  try {
    const { customerId } = req.params;
    const newAddress = req.body.address;

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      {
        $push: {
          addresses: {
            $each: [newAddress],
            $position: 0, // <-- insert at index 0
          },
        },
      },
      { new: true },
    );

    if (!customer) {
      return reply.status(404).send({ message: "Customer not found" });
    }

    return reply.send({
      message: "Address added successfully",
      customer,
    });
  } catch (error) {
    return reply.status(500).send({
      message: "Error adding address",
      error,
    });
  }
};

export const updateCustomerAddress = async (req, reply) => {
  try {
    console.log("🚀 updateCustomerAddress HIT");

    const customerId = req.user?.userId;
    const { addressId } = req.params;

    console.log("🆔 customerId:", customerId);
    console.log("🏠 addressId:", addressId);

    console.log("📦 BODY:", req.body);

    const { name, phone, houseNo, location, city, state, pincode } = req.body;

    const customer = await Customer.findById(customerId);

    console.log("👤 customer found:", !!customer);

    if (!customer) {
      return reply.status(404).send({
        message: "Customer not found",
      });
    }

    const address = customer.addresses.id(addressId);

    console.log("📍 address found:", !!address);

    if (!address) {
      return reply.status(404).send({
        message: "Address not found",
      });
    }

    // ✅ Update fields
    address.name = name;
    address.phone = phone;
    address.houseNo = houseNo;
    address.location = location;
    address.city = city;
    address.state = state;
    address.pincode = pincode;

    await customer.save();

    console.log("✅ Address updated successfully");

    return reply.send({
      message: "Address updated successfully",
      customer,
    });
  } catch (error) {
    console.log("❌ BACKEND ERROR:", error);

    return reply.status(500).send({
      message: "Error updating address",
      error,
    });
  }
};

export const deleteCustomerAddress = async (req, reply) => {
  try {
    console.log("🚀 deleteCustomerAddress HIT");

    const customerId = req.user?.userId;
    const { addressId } = req.params;

    console.log("🆔 customerId:", customerId);
    console.log("🏠 addressId:", addressId);

    const customer = await Customer.findById(customerId);

    console.log("👤 customer found:", !!customer);

    if (!customer) {
      return reply.status(404).send({
        message: "Customer not found",
      });
    }

    const beforeCount = customer.addresses.length;

    customer.addresses = customer.addresses.filter(
      (addr) => addr._id.toString() !== addressId,
    );

    const afterCount = customer.addresses.length;

    console.log("📦 Addresses before:", beforeCount);
    console.log("📦 Addresses after:", afterCount);

    await customer.save();

    console.log("✅ Address deleted successfully");

    return reply.send({
      message: "Address deleted successfully",
      customer,
    });
  } catch (error) {
    console.log("❌ DELETE ADDRESS ERROR:", error);

    return reply.status(500).send({
      message: "Error deleting address",
      error,
    });
  }
};

export const selectCustomerAddress = async (req, reply) => {
  try {
    const customerId = req.user?.userId; // 🔐 FROM JWT;
    const { addressId } = req.body;

    console.log("🆔 customerId:", customerId);
    console.log("🏠 addressId:", addressId);

    if (!addressId) {
      return reply.status(400).send({
        message: "addressId is required",
      });
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return reply.status(404).send({
        message: "Customer not found",
      });
    }

    const addressIndex = customer.addresses.findIndex(
      (addr) => addr._id.toString() === addressId,
    );

    if (addressIndex === -1) {
      return reply.status(404).send({
        message: "Address not found",
      });
    }

    // 🔥 Move selected address to index 0
    const [selectedAddress] = customer.addresses.splice(addressIndex, 1);
    customer.addresses.unshift(selectedAddress);

    await customer.save();

    return reply.send({
      message: "Address selected successfully",
      addresses: customer.addresses,
    });
  } catch (error) {
    return reply.status(500).send({
      message: "Error selecting address",
      error,
    });
  }
};

export const sendOtp = async (req, reply) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return reply.code(400).send({ message: "Phone is required" });
    }

    if (phone !== "9999911111") {
      return reply
        .code(403)
        .send({ message: "This number is not allowed for review login" });
    }

    // Later Twilio integration -> for now return 11111
    console.log(`OTP 11111 sent to phone: ${phone}`);

    return reply.send({ success: true });
  } catch (error) {
    return reply.status(500).send({ message: "Error sending OTP", error });
  }
};

export const verifyOtp = async (req, reply) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return reply.code(400).send({ message: "Phone and OTP required" });
    }

    // ⭐ Block all other numbers
    if (phone !== "9999911111") {
      return reply.code(403).send({ message: "Invalid review number" });
    }

    if (otp !== "11111") {
      return reply.code(401).send({ message: "Invalid OTP" });
    }

    // Find or create Customer
    let customer = await Customer.findOne({ phone });

    if (!customer) {
      customer = new Customer({
        phone,
        role: "Customer",
        isActivated: true,
      });
      await customer.save();
    }

    // Use your existing token generator
    const { accessToken, refreshToken } = generateTokens(customer);

    return reply.send({
      message: "OTP Verified",
      accessToken,
      refreshToken,
      customer,
    });
  } catch (error) {
    return reply.status(500).send({ message: "Error verifying OTP", error });
  }
};

// export const phoneEmailLogin = async (req, reply) => {
//   try {
//     const { token } = req.body;
//     console.log("🔐 TOKEN RECEIVED:", token);
//     console.log("AUTH HEADER:", req.headers.authorization);
//     console.log("DECODED:", jwt.decode(token));

//     if (!token) {
//       return reply.status(400).send({ message: "Token is required" });
//     }

//     // 🔐 VERIFY phone.email JWT
//     const decoded = jwt.verify(token, process.env.PHONE_EMAIL_API_KEY);

//     console.log("✅ DECODED:", decoded);
//     /**
//      decoded payload example:
//      {
//        iss: "phmail",
//        aud: "user",
//        user_country_code: "+91",
//        user_phone_number: "9876543210",
//        user_first_name: "Abhishek",
//        user_last_name: "Kumar",
//        iat: 1710000000,
//        exp: 1710003600
//      }
//     */

//     // ✅ Replace country_code + phone_no (DOC MEANS THIS)
//     const phone = decoded.user_country_code + decoded.user_phone_number;

//     let customer = await Customer.findOne({ phone });

//     if (!customer) {
//       customer = await Customer.create({
//         phone,
//         role: "Customer",
//         isActivated: true,
//       });
//     }

//     // 🔑 Issue YOUR JWT
//     const { accessToken, refreshToken } = generateTokens(customer);

//     return reply.send({
//       message: "Login successful",
//       accessToken,
//       refreshToken,
//       customer,
//     });
//   } catch (err) {
//     return reply.status(401).send({
//       message: "Invalid or expired phone.email token",
//     });
//   }
// };

export const phoneEmailLogin = async (req, reply) => {
  try {
    const { token } = req.body;
    if (!token) return reply.status(400).send({ message: "Token required" });

    const decoded = jwt.decode(token);

    if (!decoded || decoded.iss !== "phmail") {
      return reply.status(401).send({ message: "Invalid phone.email token" });
    }

    console.log("✅ Phone.Email Payload:", decoded);

    // ✅ CORRECT FIELDS
    const phone = decoded.country_code + decoded.phone_no;
    // const name = decoded.user_first_name + decoded.user_last_name;
    const name =
      `${decoded.user_first_name || ""}${decoded.user_last_name || ""}`.trim();

    console.log("FIRST:", decoded.user_first_name);
    console.log("LAST:", decoded.user_last_name);
    console.log("NAME:", name);
    console.log("TYPE:", typeof name);

    let customer = await Customer.findOne({ phone });

    if (!customer) {
      customer = await Customer.create({
        name,
        phone,
        role: "Customer",
        isActivated: true,
      });
      console.log("CREATED CUSTOMER:", customer);
    }

    const { accessToken, refreshToken } = generateTokens(customer);

    console.log("CUSTOMER BEFORE RESPONSE:", customer);
    console.log("FINAL CUSTOMER:", customer);
    return reply.send({
      message: "Login successful",
      accessToken,
      refreshToken,
      customer,
    });
  } catch (err) {
    console.log("PHONE EMAIL LOGIN ERROR:", err);
    return reply.status(401).send({ message: "Login failed" });
  }
};

// export const phoneEmailLogin = async (req, reply) => {
//   try {
//     const { token, phone, otp } = req.body;

//     /** 🟢 GOOGLE PLAY REVIEW TEST LOGIN */
//     if (phone === "9999911111" && otp === "11111") {
//       let customer = await Customer.findOne({ phone });

//       if (!customer) {
//         customer = await Customer.create({
//           name: "Google Reviewer",
//           phone: "9999911111",
//           role: "Customer",
//           isActivated: true,
//         });
//       }

//       const { accessToken, refreshToken } = generateTokens(customer);

//       return reply.send({
//         message: "Test login successful",
//         accessToken,
//         refreshToken,
//         customer,
//       });
//     }

//     /** 🔽 NORMAL PHONE.EMAIL LOGIN FLOW */
//     if (!token) return reply.status(400).send({ message: "Token required" });

//     // const decoded = jwt.decode(token);

//     // if (!decoded || decoded.iss !== "phmail") {
//     //   return reply.status(401).send({ message: "Invalid phone.email token" });
//     // }

//     const decoded = jwt.decode(token);

//     if (!decoded) {
//       return reply.status(401).send({ message: "Invalid token" });
//     }

//     console.log("PHONE.EMAIL PAYLOAD:", decoded);

//     // let phone;
//     // let name;

//     // ⭐ GOOGLE REVIEW BYPASS
//     if (decoded.phone_no === "9999911111") {
//       phone = "9999911111";
//       name = "Google Reviewer";
//     } else {
//       if (decoded.iss !== "phmail") {
//         return reply.status(401).send({ message: "Invalid phone.email token" });
//       }

//       phone = decoded.country_code + decoded.phone_no;
//       name = decoded.first_name + decoded.last_name;
//     }

//     console.log("✅ Phone.Email Payload:", decoded);

//     const phoneNumber = decoded.country_code + decoded.phone_no;
//     const name = decoded.first_name + decoded.last_name;

//     let customer = await Customer.findOne({ phone: phoneNumber });

//     if (!customer) {
//       customer = await Customer.create({
//         name,
//         phone: phoneNumber,
//         role: "Customer",
//         isActivated: true,
//       });
//     }

//     const { accessToken, refreshToken } = generateTokens(customer);

//     return reply.send({
//       message: "Login successful",
//       accessToken,
//       refreshToken,
//       customer,
//     });
//   } catch (err) {
//     console.log("PHONE EMAIL LOGIN ERROR:", err);
//     return reply.status(401).send({ message: "Login failed" });
//   }
// };

export const loginDeliveryPartner = async (req, reply) => {
  try {
    const { email, password } = req.body;
    const deliveryPartner = await DeliveryPartner.findOne({ email });

    if (!deliveryPartner) {
      return reply.status(404).send({ message: "Delivery Partner not found" });
    }

    const isMatch = password === deliveryPartner.password;

    if (!isMatch) {
      return reply.status(400).send({ message: "Invalid Credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(deliveryPartner);

    return reply.send({
      message: "Login Successful",
      accessToken,
      refreshToken,
      deliveryPartner,
    });
  } catch (error) {
    return reply.status(500).send({ message: "An error occurred", error });
  }
};

export const refreshToken = async (req, reply) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return reply.status(401).send({ message: "Refresh token required" });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    let user;

    if (decoded.role === "Customer") {
      user = await Customer.findById(decoded.userId);
    } else if (decoded.role === "DeliveryPartner") {
      user = await DeliveryPartner.findById(decoded.userId);
    } else {
      return reply.status(403).send({ message: "Invalid Role" });
    }

    if (!user) {
      return reply.status(403).send({ message: "User not found" });
    }
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    return reply.send({
      message: "Token Refreshed",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return reply.status(403).send({ message: "Invalid Refresh Token" });
  }
};

export const fetchUser = async (req, reply) => {
  try {
    const { userId, role } = req.user;
    let user;

    if (role === "Customer") {
      user = await Customer.findById(userId);
    } else if (role === "DeliveryPartner") {
      user = await DeliveryPartner.findById(userId);
    } else {
      return reply.status(403).send({ message: "Invalid Role" });
    }

    if (!user) {
      return reply.status(404).send({ message: "User not found" });
    }

    return reply.send({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    return reply.status(500).send({ message: "An error occurred", error });
  }
};
