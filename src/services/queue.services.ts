import { PrismaClient } from "@prisma/client";
import type { IGlobalResponse } from "../interface/global.interface.js";

const prisma = new PrismaClient();

export const SGetAllQueues = async () => {
  const queues = await prisma.queue.findMany();
  return {
    status: true,
    message: "Queues retrieved successfully",
    data: queues,
  };
};

export const SGetQueueDetails = async (id: number) => {
  const queue = await prisma.queue.findUnique({
    where: { id },
  });

  if (!queue) {
    throw Error("Queue not found");
  }

  return {
    status: true,
    message: "Queue details retrieved successfully",
    data: queue,
  };
};

export const SUpdateQueue = async (id: number, status: string) => {
  const existingQueue = await prisma.queue.findUnique({
    where: { id },
  });

  if (!existingQueue) {
    throw Error("Queue not found");
  }

  const updatedQueue = await prisma.queue.update({
    where: { id },
    data: { status },
  });

  return {
    status: true,
    message: "Queue updated successfully",
    data: updatedQueue,
  };
};

export const SCreateQueue = async (
  counterId: number,
  number: number,
  status: string
) => {
  const counter = await prisma.counter.findUnique({
    where: { id: counterId },
  });

  if (!counter) {
    throw Error("Counter not found");
  }

  const newQueue = await prisma.queue.create({
    data: {
      counterId,
      number,
      status,
    },
  });

  return {
    status: true,
    message: "Queue created successfully",
    data: newQueue,
  };
};

export const SDeleteQueue = async (id: number) => {
  const existingQueue = await prisma.queue.findUnique({
    where: { id },
  });

  if (!existingQueue) {
    throw Error("Queue not found");
  }

  await prisma.queue.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return {
    status: true,
    message: "Queue deleted successfully",
  };
};

export const SClaimQueue = async (): Promise<IGlobalResponse> => {
  try {
    const counter = await prisma.counter.findFirst({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });

    if (!counter) {
      throw Error("No active counters available");
    }

    let NextQueueNumber = counter.currentQueue + 1;

    const queue = await prisma.queue.create({
      data: {
        status: "claimed",
        number: NextQueueNumber,
        counterId: counter.id,
      },
      include: { counter: true },
    });

    await prisma.counter.update({
      where: { id: counter.id },
      data: { currentQueue: NextQueueNumber },
    });

    return {
      status: true,
      message: "Queue claimed successfully",
      data: queue,
    };
  } catch (error) {
    throw error;
  }
};

export const SNextQueue = async (counterId: number) => {
  try {
    const counter = await prisma.counter.findUnique({
      where: { id: counterId, isActive: true, deletedAt: null },
    });

    if (!counter) {
      throw Error("Counter not found or inactive");
    }

    const claimedQueue = await prisma.queue.findFirst({
      where: {
        counterId: counter.id,
        status: "claimed",
      },
      orderBy: { createdAt: "asc" },
    });

    if (!claimedQueue) {
      throw Error("No claimed queues available");
    }

    await prisma.queue.update({
      where: { id: claimedQueue.id },
      data: { status: "called" },
    });

    return {
      status: true,
      message: "Next queue called successfully",
      data: claimedQueue,
    };
  } catch (error) {
    throw error;
  }
};

export const SReleaseQueue = async (id: number) => {
  const existingQueue = await prisma.queue.findUnique({
    where: { id },
  });

  if (!existingQueue) {
    throw Error("Queue not found");
  }

  const updatedQueue = await prisma.queue.update({
    where: { id },
    data: { status: "completed" },
  });

  return {
    status: true,
    message: "Queue released successfully",
    data: updatedQueue,
  };
};

// export const SCurrentQueue = async () => {
//   const counters = await prisma.counter.findMany({
//     where: { isActive: true, deletedAt: null },
//     include: {
//       queues: {
//         where: { status: "called" },
//         orderBy: { createdAt: "desc" },
//       },
//     },
//   });
// };
