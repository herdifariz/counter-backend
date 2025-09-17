import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const SGetAllCounters = async () => {
  const counters = await prisma.counter.findMany();
  return {
    status: true,
    message: "Counters retrieved successfully",
    data: counters,
  };
};

export const SGetCounterDetails = async (id: number) => {
  const counter = await prisma.counter.findUnique({
    where: { id },
  });

  if (!counter) {
    throw Error("Counter not found");
  }

  return {
    status: true,
    message: "Counter details retrieved successfully",
    data: counter,
  };
};

export const SUpdateCounter = async (
  id: number,
  name: string,
  maxQueue: number,
  currentQueue: number
) => {
  const existingCounter = await prisma.counter.findUnique({
    where: { id },
  });
  if (!existingCounter) {
    throw Error("Counter not found");
  }

  const updateData: any = {
    name,
    maxQueue,
    currentQueue,
  };

  const updatedCounter = await prisma.counter.update({
    where: { id },
    data: updateData,
  });

  return {
    status: true,
    message: "Counter updated successfully",
    data: updatedCounter,
  };
};

export const SUpdateCounterStatus = async (id: number, status: string) => {
  const existingCounter = await prisma.counter.findUnique({
    where: { id },
  });

  if (!existingCounter) {
    throw Error("Counter not found");
  }

  let updateData: any = {};

  switch (status) {
    case "active":
      updateData = {
        isActive: true,
        deletedAt: null,
      };
      break;
    case "inactive":
      updateData = {
        isActive: false,
        deletedAt: null,
      };
      break;
    case "disable":
      updateData = {
        isActive: false,
        deletedAt: new Date(),
      };
      break;
  }

  const updatedCounter = await prisma.counter.update({
    where: { id },
    data: updateData,
  });

  return {
    status: true,
    message: "Counter status updated successfully",
    data: updatedCounter,
  };
};

export const SCreateCounter = async (name: string, maxQueue: number) => {
  const existingCounter = await prisma.counter.findFirst({
    where: {
      name: {
        equals: name.trim(),
        mode: "insensitive",
      },
    },
  });

  if (existingCounter) {
    throw Error("Counter name already exists");
  }

  const counter = await prisma.counter.create({
    data: {
      name,
      maxQueue,
    },
  });

  return {
    status: true,
    message: "Counter created successfully",
    data: counter,
  };
};

export const SDeleteCounter = async (id: number) => {
  const existingCounter = await prisma.counter.findUnique({
    where: { id },
  });

  if (!existingCounter) {
    throw Error("Counter not found");
  }

  await prisma.counter.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  return {
    status: true,
    message: "Counter deleted successfully",
  };
};
