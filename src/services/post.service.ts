import { Types } from "mongoose";

import { Follow } from "../models/Follow.js";
import { Post } from "../models/Post.js";
import { HttpError } from "../utils/httpError.js";
import { toPublicUser, type PublicUser } from "./user.service.js";

export type PublicPost = {
  id: string;
  content: string;
  author: PublicUser;
  createdAt: string;
  updatedAt: string;
};

const toPublicPost = (post: {
  _id?: unknown;
  id?: string;
  content: string;
  author: unknown;
  createdAt: Date;
  updatedAt: Date;
}): PublicPost => {
  const author = post.author as { toObject: () => object } | Record<string, unknown>;

  return {
    id: post.id ?? String(post._id),
    content: post.content,
    author:
      typeof author === "object" && author !== null && "toObject" in author
        ? toPublicUser((author as { toObject: () => object }).toObject() as Record<string, unknown> as PublicUser)
        : toPublicUser(author as Record<string, unknown> as PublicUser),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
};

export const createPost = async (authorId: string, content: string) => {
  if (!Types.ObjectId.isValid(authorId)) {
    throw new HttpError(400, "Invalid author");
  }

  const post = await Post.create({
    author: authorId,
    content: content.trim(),
  });

  const hydrated = await Post.findById(post._id).populate("author");

  if (!hydrated) {
    throw new HttpError(500, "Could not create post");
  }

  return toPublicPost(hydrated.toObject());
};

export const getFeed = async (currentUserId: string, limit = 25) => {
  const follows = await Follow.find({ follower: currentUserId }).select("following").lean();
  const ids = follows.map((entry) => entry.following);

  ids.push(new Types.ObjectId(currentUserId));

  const posts = await Post.find({ author: { $in: ids } })
    .populate("author")
    .sort({ createdAt: -1 })
    .limit(limit);

  return posts.map((post) => toPublicPost(post.toObject()));
};

export const getPostsForUser = async (userId: string, limit = 50) => {
  const posts = await Post.find({ author: userId })
    .populate("author")
    .sort({ createdAt: -1 })
    .limit(limit);

  return posts.map((post) => toPublicPost(post.toObject()));
};
