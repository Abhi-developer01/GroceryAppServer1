import "dotenv/config";
import { connectDB } from "./src/config/connect.js";
import fastify from "fastify";
import { PORT } from "./src/config/config.js";

import fastifySocketIO from "fastify-socket.io";
import { registerRoutes } from "./src/routes/index.js";
import { admin, buildAdminRouter } from "./src/config/setup.js";
// import fastifyMultipart from "@fastify/multipart";

const start = async () => {
  await connectDB(process.env.MONGO_URI);
  const app = fastify();

  // await app.register(fastifyMultipart, {
  //   limits: {
  //     fileSize: 5 * 1024 * 1024, // 5MB
  //   },
  // });

  app.register(fastifySocketIO, {
    cors: {
      origin: "*",
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ["websocket"],
  });
  await registerRoutes(app);

  await buildAdminRouter(app);

  app.listen({ port: PORT, host: "0.0.0.0" }, (err, addr) => {
    if (err) {
      console.log(err);
    } else {
      console.log(
        `Grocery App running on http://localhost:${PORT}${admin.options.rootPath}`
      );
    }
  });

  app.ready().then(() => {
    app.io.on("connection", (socket) => {
      console.log("A User Connected ✅");

      socket.on("joinRoom", (orderId) => {
        socket.join(orderId);
        console.log(`🪴User Joined room ${orderId}`);
      });

      socket.on("disconnect", () => {
        console.log("User Disconnected X");
      });
    });
  });
};
start();
