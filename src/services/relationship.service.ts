import { Types } from "mongoose";

import { Follow } from "../models/Follow.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { toPublicUser, type PublicUser } from "./user.service.js";

export type ConnectionEntry = {
  user: PublicUser;
  followedAt: string;
};

export const followUser = async (currentUserId: string, targetUserId: string) => {
  if (!Types.ObjectId.isValid(targetUserId)) {
    throw new HttpError(400, "Invalid user id");
  }

  if (currentUserId === targetUserId) {
    throw new HttpError(400, "You cannot follow yourself");
  }

  const targetUser = await User.exists({ _id: targetUserId });

  if (!targetUser) {
    throw new HttpError(404, "User not found");
  }

  try {
    await Follow.create({
      follower: currentUserId,
      following: targetUserId,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new HttpError(409, "Already following this user");
    }

    throw error;
  }
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
  if (!Types.ObjectId.isValid(targetUserId)) {
    throw new HttpError(400, "Invalid user id");
  }

  await Follow.findOneAndDelete({
    follower: currentUserId,
    following: targetUserId,
  });
};

export const getFollowers = async (currentUserId: string): Promise<ConnectionEntry[]> => {
  const records = await Follow.find({ following: currentUserId })
    .populate("follower")
    .sort({ createdAt: -1 });

  return records
    .map((record) => {
      const follower = record.follower as unknown;

      if (!follower || typeof follower !== "object") {
        return null;
      }

      return {
        user: toPublicUser((follower as { toObject: () => object }).toObject() as Record<string, unknown> as PublicUser),
        followedAt: record.createdAt.toISOString(),
      };
    })
    .filter((entry): entry is ConnectionEntry => Boolean(entry));
};

export const getFollowing = async (currentUserId: string): Promise<ConnectionEntry[]> => {
  const records = await Follow.find({ follower: currentUserId })
    .populate("following")
    .sort({ createdAt: -1 });

  return records
    .map((record) => {
      const following = record.following as unknown;

      if (!following || typeof following !== "object") {
        return null;
      }

      return {
        user: toPublicUser(
          (following as { toObject: () => object }).toObject() as Record<string, unknown> as PublicUser,
        ),
        followedAt: record.createdAt.toISOString(),
      };
    })
    .filter((entry): entry is ConnectionEntry => Boolean(entry));
};

export const getConnectionStats = async (currentUserId: string) => {
  const [followers, following] = await Promise.all([
    Follow.countDocuments({ following: currentUserId }),
    Follow.countDocuments({ follower: currentUserId }),
  ]);

  return {
    followers,
    following,
  };
};
