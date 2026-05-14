// import Theme from "../models/theme.js";

// export const getActiveTheme = async (req, reply) => {
//   try {
//     const theme = await Theme.findOne({ isActive: true })
//       .sort({ updatedAt: -1 })
//       .lean();

//     return reply.send({
//       theme: theme?.name || "default",
//     });
//   } catch (error) {
//     return reply.status(500).send({
//       message: "Error fetching theme",
//     });
//   }
// };

import Theme from "../../models/theme.js";

export const getActiveTheme = async (req, reply) => {
  try {
    console.log("👉 [GET /ui-config] Request received");

    const theme = await Theme.findOne({ isActive: true })
      .sort({ updatedAt: -1 })
      .lean();

    console.log("📦 Theme from DB:", theme);

    const response = {
      theme: theme?.name || "default",
    };

    console.log("🚀 Response sent:", response);

    return reply.send(response);
  } catch (error) {
    console.error("❌ Error fetching theme:", error);

    return reply.status(500).send({
      message: "Error fetching theme",
    });
  }
};
