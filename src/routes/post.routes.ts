import { Router } from "express";

import { createPostHandler, getFeedHandler, getUserPostsHandler } from "../controllers/post.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get("/feed", asyncHandler(getFeedHandler));
router.get("/user/:userId", asyncHandler(getUserPostsHandler));
router.post("/", asyncHandler(createPostHandler));

export { router as postRoutes };
