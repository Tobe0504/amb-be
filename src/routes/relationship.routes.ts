import { Router } from "express";

import {
  follow,
  followers,
  following,
  unfollow,
} from "../controllers/relationship.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.post("/:userId/follow", asyncHandler(follow));
router.delete("/:userId/follow", asyncHandler(unfollow));
router.get("/followers", asyncHandler(followers));
router.get("/following", asyncHandler(following));

export { router as relationshipRoutes };
