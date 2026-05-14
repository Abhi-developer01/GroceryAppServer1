// import { getActiveTheme } from "../controllers/theme/theme";

// export const themeRoutes = async (fastify, options) => {
//   fastify.get("/ui-config", getActiveTheme);
// };

import { getActiveTheme } from "../controllers/theme/theme.js";

export const themeRoutes = async (fastify) => {
  fastify.get("/ui-config", async (req, reply) => {
    console.log("🔥 /ui-config route hit");
    return getActiveTheme(req, reply);
  });
};
