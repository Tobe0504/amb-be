import { Router } from "express";

import { createRoomHandler, getRoomMessagesHandler, listRoomsHandler } from "../controllers/chat.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get("/rooms", asyncHandler(listRoomsHandler));
router.post("/rooms", asyncHandler(createRoomHandler));
router.get("/rooms/:roomId/messages", asyncHandler(getRoomMessagesHandler));

export { router as chatRoutes };
