import { createHash, randomInt } from "crypto";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { AuthOtp } from "../models/AuthOtp.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { sendLoginOtpEmail } from "./email.service.js";
import { roleExists } from "./role.service.js";
import { toPublicUser } from "./user.service.js";

export type RequestOtpInput = {
  email: string;
  name?: string;
  mode?: "login" | "register";
};

export type VerifyOtpInput = {
  email: string;
  code: string;
  name?: string;
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const createToken = (userId: string) => {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const createOtpCode = () => String(randomInt(100000, 1000000));

const hashOtp = (email: string, code: string) => {
  return createHash("sha256")
    .update(`${normalizeEmail(email)}:${code}:${env.JWT_SECRET}`)
    .digest("hex");
};

const buildDefaultName = (email: string) => {
  const local = normalizeEmail(email).split("@")[0] ?? "circle-user";
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .slice(0, 80);
};

export const requestLoginOtp = async (payload: RequestOtpInput) => {
  const email = normalizeEmail(payload.email);
  const existingUser = await User.findOne({ email }).lean();

  if (payload.mode === "register" && existingUser) {
    throw new HttpError(409, "Email already in use. Please log in instead.");
  }

  if (payload.mode === "login" && !existingUser) {
    throw new HttpError(404, "No account found for this email. Please register first.");
  }

  const code = createOtpCode();
  const codeHash = hashOtp(email, code);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000);

  await AuthOtp.deleteMany({ email });
  await AuthOtp.create({
    email,
    codeHash,
    expiresAt,
  });

  const delivery = await sendLoginOtpEmail(email, code);

  return {
    delivery,
    expiresAt: expiresAt.toISOString(),
    devOtp: env.NODE_ENV !== "production" ? code : undefined,
  };
};

export const verifyLoginOtp = async (payload: VerifyOtpInput) => {
  const email = normalizeEmail(payload.email);
  const code = payload.code.trim();

  const otp = await AuthOtp.findOne({ email, consumedAt: null }).sort({ createdAt: -1 });

  if (!otp) {
    throw new HttpError(400, "No active OTP found. Request a new code.");
  }

  if (otp.expiresAt.getTime() <= Date.now()) {
    throw new HttpError(400, "OTP has expired. Request a new code.");
  }

  if (otp.attempts >= 5) {
    throw new HttpError(429, "Too many invalid attempts. Request a new code.");
  }

  const expectedHash = hashOtp(email, code);

  if (expectedHash !== otp.codeHash) {
    otp.attempts += 1;
    await otp.save();
    throw new HttpError(401, "Invalid OTP code");
  }

  otp.consumedAt = new Date();
  await otp.save();

  let user = await User.findOne({ email });

  if (!user) {
    const nameFromInput = payload.name?.trim();
    const name = nameFromInput && nameFromInput.length >= 2 ? nameFromInput : buildDefaultName(email);

    if (payload.name && payload.name.trim().length > 0 && payload.name.trim().length < 2) {
      throw new HttpError(400, "Name must be at least 2 characters");
    }

    user = await User.create({
      email,
      name,
    });
  }

  if (user.role && !(await roleExists(user.role))) {
    user.role = "";
    await user.save();
  }

  const token = createToken(user.id);

  return {
    token,
    user: toPublicUser(user.toObject()),
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return toPublicUser(user.toObject());
};
