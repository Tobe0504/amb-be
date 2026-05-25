import { Router } from "express";

import { logout, me, requestOtp, verifyOtp } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/rateLimit.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/request-otp", authRateLimit, asyncHandler(requestOtp));
router.post("/verify-otp", authRateLimit, asyncHandler(verifyOtp));
router.post("/logout", asyncHandler(logout));
router.get("/me", requireAuth, asyncHandler(me));

export { router as authRoutes };
