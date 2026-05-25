import type { Request, Response } from "express";
import { z } from "zod";

import { countPeopleAvailable } from "../services/user.service.js";
import { clearAuthCookie, setAuthCookie } from "../utils/cookie.js";
import { HttpError } from "../utils/httpError.js";
import { getConnectionStats } from "../services/relationship.service.js";
import { getCurrentUser, requestLoginOtp, verifyLoginOtp } from "../services/auth.service.js";

const requestOtpSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80).optional(),
  mode: z.enum(["login", "register"]).optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Code must be a 6-digit number"),
  name: z.string().min(2).max(80).optional(),
});

export const requestOtp = async (req: Request, res: Response) => {
  const payload = requestOtpSchema.parse(req.body);
  const response = await requestLoginOtp(payload);

  res.json({
    success: true,
    data: {
      message: "OTP sent successfully",
      expiresAt: response.expiresAt,
      channel: response.delivery.channel,
      devOtp: response.devOtp,
    },
  });
};

export const verifyOtp = async (req: Request, res: Response) => {
  const payload = verifyOtpSchema.parse(req.body);
  const { token, user } = await verifyLoginOtp(payload);
  const [stats, peopleAvailable] = await Promise.all([
    getConnectionStats(user.id),
    countPeopleAvailable(user.id),
  ]);

  setAuthCookie(res, token);
  res.json({
    success: true,
    data: {
      user,
      stats: {
        ...stats,
        peopleAvailable,
      },
    },
  });
};

export const logout = async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({
    success: true,
    data: {
      message: "Logged out successfully",
    },
  });
};

export const me = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new HttpError(401, "Authentication required");
  }

  const [user, stats, peopleAvailable] = await Promise.all([
    getCurrentUser(req.user.id),
    getConnectionStats(req.user.id),
    countPeopleAvailable(req.user.id),
  ]);

  res.json({
    success: true,
    data: {
      user,
      stats: {
        ...stats,
        peopleAvailable,
      },
    },
  });
};
