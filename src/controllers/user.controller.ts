import type { Request, Response } from "express";
import { z } from "zod";

import {
  getUserById,
  listUsers,
  updateCurrentUser,
  uploadUserAvatar,
} from "../services/user.service.js";
import { HttpError } from "../utils/httpError.js";

const idParamSchema = z.object({
  id: z.string().min(1),
});

const updateProfileSchema = z
  .object({
    name: z.string().min(2).max(80).optional(),
    bio: z.string().max(280).optional(),
    role: z.string().max(80).optional(),
    location: z.string().max(80).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Provide at least one field to update",
  });

export const getUsers = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  const users = await listUsers(req.user.id);

  res.json({
    success: true,
    data: {
      users,
    },
  });
};

export const getUser = async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const user = await getUserById(id);

  res.json({
    success: true,
    data: {
      user,
    },
  });
};

export const updateMe = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  const payload = updateProfileSchema.parse(req.body);
  const user = await updateCurrentUser(req.user.id, payload);

  res.json({
    success: true,
    data: {
      user,
    },
  });
};

export const uploadAvatar = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  if (!req.file) {
    throw new HttpError(400, "Please provide an image file");
  }

  const user = await uploadUserAvatar(req.user.id, req.file);

  res.json({
    success: true,
    data: {
      user,
    },
  });
};
