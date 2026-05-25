import { Router } from "express";

import { getRoles } from "../controllers/meta.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/roles", asyncHandler(getRoles));

export { router as metaRoutes };
