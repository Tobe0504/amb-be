import { createServer } from "http";

import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { ensureRolesSeeded } from "./services/role.service.js";
import { initSocket } from "./socket/index.js";

const startServer = async () => {
  await connectDB();
  await ensureRolesSeeded();

  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`Circle backend listening on http://localhost:${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
