import type { Request, Response } from "express";
import { z } from "zod";

import { createRoom, getRoomMessages, listRooms } from "../services/chat.service.js";
import { emitRoomCreated } from "../socket/index.js";
import { HttpError } from "../utils/httpError.js";

const createRoomSchema = z.object({
  name: z.string().max(80).optional(),
  memberIds: z.array(z.string().min(1)).min(1),
});

const roomParamSchema = z.object({
  roomId: z.string().min(1),
});

export const listRoomsHandler = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  const rooms = await listRooms(req.user.id);

  res.json({
    success: true,
    data: {
      rooms,
    },
  });
};

export const createRoomHandler = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  const payload = createRoomSchema.parse(req.body);
  const room = await createRoom(req.user.id, payload);
  emitRoomCreated(room);

  res.status(201).json({
    success: true,
    data: {
      room,
    },
  });
};

export const getRoomMessagesHandler = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  const { roomId } = roomParamSchema.parse(req.params);
  const messages = await getRoomMessages(req.user.id, roomId);

  res.json({
    success: true,
    data: {
      messages,
    },
  });
};
