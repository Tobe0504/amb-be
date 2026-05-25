import type { Express } from "express";

import { cloudinary } from "../config/cloudinary.js";
import { Follow } from "../models/Follow.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { roleExists } from "./role.service.js";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  bio: string;
  role: string;
  location: string;
  avatarUrl: string | null;
  avatarPublicId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicPeopleUser = PublicUser & {
  isFollowing: boolean;
};

export type ProfileUpdateInput = {
  name?: string;
  bio?: string;
  role?: string;
  location?: string;
};

type UserLike = {
  _id?: unknown;
  id?: string;
  email: string;
  name: string;
  bio?: string;
  role?: string;
  location?: string;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

const toISO = (value?: Date | string) => {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return value.toISOString();
};

export const toPublicUser = (user: UserLike): PublicUser => ({
  id: user.id ?? String(user._id),
  email: user.email,
  name: user.name,
  bio: user.bio ?? "",
  role: user.role ?? "",
  location: user.location ?? "",
  avatarUrl: user.avatarUrl ?? null,
  avatarPublicId: user.avatarPublicId ?? null,
  createdAt: toISO(user.createdAt),
  updatedAt: toISO(user.updatedAt),
});

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return toPublicUser(user.toObject());
};

export const listUsers = async (currentUserId: string): Promise<PublicPeopleUser[]> => {
  const [users, following] = await Promise.all([
    User.find({ _id: { $ne: currentUserId } }).sort({ createdAt: -1 }).lean(),
    Follow.find({ follower: currentUserId }).select("following").lean(),
  ]);

  const followingIds = new Set(following.map((entry) => String(entry.following)));

  return users.map((user) => {
    const publicUser = toPublicUser(user);
    return {
      ...publicUser,
      isFollowing: followingIds.has(publicUser.id),
    };
  });
};

export const updateCurrentUser = async (userId: string, payload: ProfileUpdateInput) => {
  if (payload.role && !(await roleExists(payload.role))) {
    throw new HttpError(400, "Selected role is not valid");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: payload,
    },
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return toPublicUser(user);
};

const uploadImageToCloudinary = async (file: Express.Multer.File) => {
  const encoded = file.buffer.toString("base64");
  const dataUri = `data:${file.mimetype};base64,${encoded}`;

  return cloudinary.uploader.upload(dataUri, {
    folder: "circle/avatars",
    resource_type: "image",
    overwrite: true,
  });
};

export const uploadUserAvatar = async (userId: string, file: Express.Multer.File) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => undefined);
  }

  const uploaded = await uploadImageToCloudinary(file);

  user.avatarUrl = uploaded.secure_url;
  user.avatarPublicId = uploaded.public_id;
  await user.save();

  return toPublicUser(user.toObject());
};

export const countPeopleAvailable = async (currentUserId: string) => {
  return User.countDocuments({ _id: { $ne: currentUserId } });
};
