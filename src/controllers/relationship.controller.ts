import type { Request, Response } from "express";
import { z } from "zod";

import {
  followUser,
  getFollowers,
  getFollowing,
  unfollowUser,
} from "../services/relationship.service.js";
import { HttpError } from "../utils/httpError.js";

const paramsSchema = z.object({
  userId: z.string().min(1),
});

export const follow = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  const { userId } = paramsSchema.parse(req.params);
  await followUser(req.user.id, userId);

  res.status(201).json({
    success: true,
    data: {
      message: "User followed",
    },
  });
};

export const unfollow = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  const { userId } = paramsSchema.parse(req.params);
  await unfollowUser(req.user.id, userId);

  res.json({
    success: true,
    data: {
      message: "User unfollowed",
    },
  });
};

export const followers = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  const data = await getFollowers(req.user.id);

  res.json({
    success: true,
    data: {
      users: data,
      total: data.length,
    },
  });
};

export const following = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  const data = await getFollowing(req.user.id);

  res.json({
    success: true,
    data: {
      users: data,
      total: data.length,
    },
  });
};
