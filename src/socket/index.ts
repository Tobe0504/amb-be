import type { Server as HttpServer } from "http";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";

import { env } from "../config/env.js";
import { createRoomMessage, getRoomMemberIds, isRoomMember } from "../services/chat.service.js";
import { AUTH_COOKIE_NAME } from "../utils/cookie.js";

type TokenPayload = jwt.JwtPayload & {
  sub?: string;
};

type ChatMessageInput = {
  roomId: string;
  content: string;
};

type TypingInput = {
  roomId: string;
  isTyping: boolean;
};

type JoinRoomInput = {
  roomId: string;
};

let ioRef: Server | null = null;

const getUserIdFromSocket = (socket: Socket) => {
  return socket.data.userId as string | undefined;
};

export const emitRoomCreated = (room: { id: string; name: string; members: Array<{ id: string }> }) => {
  if (!ioRef) {
    return;
  }

  for (const member of room.members) {
    ioRef.to(`user:${member.id}`).emit("chat:room-created", { room });
  }
};

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_BFF_ORIGIN,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    let token = "";

    if (cookieHeader) {
      const parsed = cookie.parse(cookieHeader);
      token = parsed[AUTH_COOKIE_NAME] ?? "";
    }

    if (!token && typeof socket.handshake.auth?.token === "string") {
      token = socket.handshake.auth.token;
    }

    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      if (!payload.sub) {
        throw new Error("Missing subject");
      }

      socket.data.userId = String(payload.sub);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = getUserIdFromSocket(socket);

    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.join(`user:${userId}`);

    socket.on("chat:join-room", async (payload: JoinRoomInput) => {
      if (!payload?.roomId) {
        return;
      }

      if (!(await isRoomMember(payload.roomId, userId))) {
        return;
      }

      socket.join(`room:${payload.roomId}`);
    });

    socket.on("chat:typing", async (payload: TypingInput) => {
      if (!payload?.roomId) {
        return;
      }

      if (!(await isRoomMember(payload.roomId, userId))) {
        return;
      }

      socket.to(`room:${payload.roomId}`).emit("chat:typing", {
        roomId: payload.roomId,
        userId,
        isTyping: payload.isTyping,
      });
    });

    socket.on("chat:message", async (payload: ChatMessageInput) => {
      if (!payload?.roomId || !payload?.content?.trim()) {
        return;
      }

      const content = payload.content.trim();

      if (content.length > 2000) {
        return;
      }

      if (!(await isRoomMember(payload.roomId, userId))) {
        return;
      }

      const message = await createRoomMessage(userId, payload.roomId, content);

      io.to(`room:${payload.roomId}`).emit("chat:message", {
        roomId: payload.roomId,
        message,
      });

      const memberIds = await getRoomMemberIds(payload.roomId);

      for (const memberId of memberIds) {
        if (memberId === userId) {
          continue;
        }

        io.to(`user:${memberId}`).emit("chat:notification", {
          roomId: payload.roomId,
          fromUserId: userId,
          preview: message.content.slice(0, 120),
          createdAt: message.createdAt,
        });
      }
    });
  });

  ioRef = io;

  return io;
};

export const getIo = () => ioRef;
