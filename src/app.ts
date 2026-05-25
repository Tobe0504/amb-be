import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { authRoutes } from "./routes/auth.routes.js";
import { chatRoutes } from "./routes/chat.routes.js";
import { metaRoutes } from "./routes/meta.routes.js";
import { postRoutes } from "./routes/post.routes.js";
import { relationshipRoutes } from "./routes/relationship.routes.js";
import { userRoutes } from "./routes/user.routes.js";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_BFF_ORIGIN,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
    },
  });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/relationships", relationshipRoutes);
app.use("/meta", metaRoutes);
app.use("/posts", postRoutes);
app.use("/chat", chatRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found",
    },
  });
});

app.use(errorHandler);

export { app };
