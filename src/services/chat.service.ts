import { Types } from "mongoose";

import { ChatRoom } from "../models/ChatRoom.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { decryptText, encryptText } from "../utils/encryption.js";
import { HttpError } from "../utils/httpError.js";
import { toPublicUser, type PublicUser } from "./user.service.js";

export type PublicRoom = {
  id: string;
  name: string;
  isGroup: boolean;
  members: PublicUser[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicMessage = {
  id: string;
  roomId: string;
  sender: PublicUser;
  content: string;
  createdAt: string;
};

const toPublicRoom = (room: {
  _id?: unknown;
  id?: string;
  name?: string;
  isGroup: boolean;
  members: unknown[];
  createdBy: unknown;
  createdAt: Date;
  updatedAt: Date;
}): PublicRoom => {
  return {
    id: room.id ?? String(room._id),
    name: room.name ?? "",
    isGroup: room.isGroup,
    members: room.members.map((member) => {
      if (member && typeof member === "object" && "toObject" in member) {
        return toPublicUser((member as { toObject: () => object }).toObject() as Record<string, unknown> as PublicUser);
      }

      return toPublicUser(member as Record<string, unknown> as PublicUser);
    }),
    createdBy: String(room.createdBy),
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
};

const toPublicMessage = (message: {
  _id?: unknown;
  id?: string;
  room: unknown;
  sender: unknown;
  cipherText: string;
  iv: string;
  authTag: string;
  createdAt: Date;
}): PublicMessage => {
  const senderObj =
    message.sender && typeof message.sender === "object" && "toObject" in message.sender
      ? (message.sender as { toObject: () => object }).toObject()
      : (message.sender as Record<string, unknown>);

  return {
    id: message.id ?? String(message._id),
    roomId: String(message.room),
    sender: toPublicUser(senderObj as PublicUser),
    content: decryptText({
      cipherText: message.cipherText,
      iv: message.iv,
      authTag: message.authTag,
    }),
    createdAt: message.createdAt.toISOString(),
  };
};

const assertRoomMembership = async (roomId: string, userId: string) => {
  const room = await ChatRoom.findById(roomId);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  const isMember = room.members.some((member) => String(member) === userId);

  if (!isMember) {
    throw new HttpError(403, "You are not a member of this room");
  }

  return room;
};

export const listRooms = async (userId: string) => {
  const rooms = await ChatRoom.find({ members: userId }).populate("members").sort({ updatedAt: -1 });

  return rooms.map((room) => toPublicRoom(room.toObject()));
};

export const createRoom = async (creatorId: string, payload: { name?: string; memberIds: string[] }) => {
  const dedupedIds = Array.from(new Set([creatorId, ...payload.memberIds])).filter((id) => Types.ObjectId.isValid(id));

  if (dedupedIds.length < 2) {
    throw new HttpError(400, "At least two members are required for a room");
  }

  const existingUsers = await User.countDocuments({ _id: { $in: dedupedIds } });

  if (existingUsers !== dedupedIds.length) {
    throw new HttpError(400, "One or more members are invalid");
  }

  const room = await ChatRoom.create({
    name: payload.name?.trim() ?? "",
    isGroup: dedupedIds.length > 2 || Boolean(payload.name?.trim()),
    members: dedupedIds,
    createdBy: creatorId,
  });

  const hydrated = await ChatRoom.findById(room._id).populate("members");

  if (!hydrated) {
    throw new HttpError(500, "Could not create room");
  }

  return toPublicRoom(hydrated.toObject());
};

export const getRoomMessages = async (userId: string, roomId: string, limit = 80) => {
  await assertRoomMembership(roomId, userId);

  const messages = await Message.find({ room: roomId }).populate("sender").sort({ createdAt: -1 }).limit(limit);

  return messages.reverse().map((message) => toPublicMessage(message.toObject()));
};

export const createRoomMessage = async (senderId: string, roomId: string, content: string) => {
  const room = await assertRoomMembership(roomId, senderId);

  const encrypted = encryptText(content.trim());

  const message = await Message.create({
    room: room._id,
    sender: senderId,
    ...encrypted,
  });

  await ChatRoom.updateOne({ _id: room._id }, { $set: { updatedAt: new Date() } });

  const hydrated = await Message.findById(message._id).populate("sender");

  if (!hydrated) {
    throw new HttpError(500, "Could not persist message");
  }

  return toPublicMessage(hydrated.toObject());
};

export const isRoomMember = async (roomId: string, userId: string) => {
  const room = await ChatRoom.findById(roomId).select("members").lean();
  if (!room) {
    return false;
  }

  return room.members.some((member) => String(member) === userId);
};

export const getRoomMemberIds = async (roomId: string) => {
  const room = await ChatRoom.findById(roomId).select("members").lean();
  if (!room) {
    return [];
  }

  return room.members.map((member) => String(member));
};
