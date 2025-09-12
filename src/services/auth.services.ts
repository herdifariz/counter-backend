import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import type { IGlobalResponse } from "../interface/global.interface.js";
import type { ILoginResponse } from "../interface/auth.interface.js";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

export const SLogin = async (
  usernameOrEmail: string,
  password: string
): Promise<IGlobalResponse<ILoginResponse>> => {
  // Find admin by username or email
  const admin = await prisma.admin.findFirst({
    where: {
      OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      isActive: true,
      deletedAt: null,
    },
  });

  if (!admin) {
    throw Error("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);

  if (!isPasswordValid) {
    throw Error("Invalid credentials");
  }

  const token = UGenerateToken({
    id: admin.id,
    username: admin.username,
    email: admin.email,
    name: admin.name,
  });
  // const token = "dummy-token";

  return {
    status: true,
    message: "Login successful",
    data: {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
      },
    },
  };
};

export const SCreate = async (
  username: string,
  email: string,
  name: string,
  password: string
): Promise<IGlobalResponse> => {
  // Check if username or email already exists
  const existingAdmin = await prisma.admin.findFirst({
    where: {
      OR: [{ username }, { email }],
      deletedAt: null,
    },
  });

  if (existingAdmin) {
    throw Error("Username or email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.admin.create({
    data: {
      username,
      email,
      name,
      password: hashedPassword,
    },
  });

  return {
    status: true,
    message: "Admin created successfully",
  };
};

export const SUpdate = async (
  id: number,
  username: string,
  email: string,
  name: string,
  password?: string
): Promise<IGlobalResponse> => {
  // Check if admin exists
  const admin = await prisma.admin.findUnique({
    where: { id },
  });
  if (!admin) {
    throw Error("Admin not found");
  }
  // Check if username or email already exists
  const existingAdmin = await prisma.admin.findFirst({
    where: {
      OR: [{ username }, { email }],
      NOT: { id },
      deletedAt: null,
    },
  });

  if (existingAdmin) {
    throw Error("Username or email already exists");
  }

  const updateData: any = {
    username,
    email,
    name,
  };

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  await prisma.admin.update({
    where: { id },
    data: updateData,
  });

  return {
    status: true,
    message: "Admin updated successfully",
  };
};

export const SDelete = async (id: number): Promise<IGlobalResponse> => {
  // Check if admin exists
  const admin = await prisma.admin.findUnique({
    where: { id },
  });
  if (!admin) {
    throw Error("Admin not found");
  }
  await prisma.admin.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return {
    status: true,
    message: "Admin deleted successfully",
  };
};

const UGenerateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
};
