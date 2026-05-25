import { Router } from "express";

import {
  getUser,
  getUsers,
  updateMe,
  uploadAvatar,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { avatarUpload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(getUsers));
router.get("/:id", asyncHandler(getUser));
router.patch("/me", asyncHandler(updateMe));
router.post("/me/avatar", avatarUpload.single("avatar"), asyncHandler(uploadAvatar));

export { router as userRoutes };
