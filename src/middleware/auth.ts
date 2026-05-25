import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { env } from "../config/env.js";
import { AUTH_COOKIE_NAME } from "../utils/cookie.js";
import { HttpError } from "../utils/httpError.js";

type TokenPayload = JwtPayload & {
  sub?: string;
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    next(new HttpError(401, "Authentication required"));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    if (!payload.sub) {
      throw new Error("Missing subject");
    }

    req.user = {
      id: String(payload.sub),
    };

    next();
  } catch {
    next(new HttpError(401, "Invalid or expired session"));
  }
};
