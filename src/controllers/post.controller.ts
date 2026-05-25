import type { Request, Response } from "express";
import { z } from "zod";

import { createPost, getFeed, getPostsForUser } from "../services/post.service.js";
import { HttpError } from "../utils/httpError.js";

const createPostSchema = z.object({
  content: z.string().min(1).max(600),
});

const userPostsSchema = z.object({
  userId: z.string().min(1),
});

export const createPostHandler = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  const payload = createPostSchema.parse(req.body);
  const post = await createPost(req.user.id, payload.content);

  res.status(201).json({
    success: true,
    data: {
      post,
    },
  });
};

export const getFeedHandler = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  const posts = await getFeed(req.user.id);

  res.json({
    success: true,
    data: {
      posts,
    },
  });
};

export const getUserPostsHandler = async (req: Request, res: Response) => {
  const { userId } = userPostsSchema.parse(req.params);
  const posts = await getPostsForUser(userId);

  res.json({
    success: true,
    data: {
      posts,
    },
  });
};
