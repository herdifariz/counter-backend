import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import type { Admin } from "@prisma/client";
import { redisClient } from "../configs/redis.config.js";
import ms from "ms";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "1d") as ms.StringValue;

export const UGenerateToken = (admin: Partial<Admin>): string => {
  const token = jwt.sign(
    { id: admin.id, username: admin.username },
    JWT_SECRET as string,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );

  const key = `token:${token.split(".")[2]}:${admin.id}`;

  redisClient.set(key, token, {
    expiration: {
      type: "EX",
      value: ms(JWT_EXPIRES_IN) / 1000,
    },
  });
  return token;
};

export const UVerifyToken = async (token: string) => {
  const payload = jwt.verify(token, JWT_SECRET);

  if (!payload || typeof payload === "string" || !payload.id) {
    throw Error("Unauthorized");
  }

  const key = `token:${token.split(".")[2]}:${payload.id}`;

  const data = await redisClient.get(key);

  if (!data || data !== token) {
    throw Error("Unauthorized");
  }

  return payload;
};

export const UInvalidateToken = (
  adminId: number,
  token: string
): Promise<number> => {
  const key = `token:${adminId}: ${token.split(".")[2]}`;
  return redisClient.del(key);
};
