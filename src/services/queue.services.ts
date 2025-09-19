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
    if (NextQueueNumber > counter.maxQueue) {
      throw Error("Counter has reached its maximum queue limit");
    }

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
  try {
    const existingQueue = await prisma.queue.findUnique({
      where: { id },
    });

    if (!existingQueue) {
      throw Error("Queue not found");
    }

    const updatedQueue = await prisma.queue.update({
      where: { id },
      data: { status: "released" },
    });

    return {
      status: true,
      message: "Queue released successfully",
      data: updatedQueue,
    };
  } catch (error) {
    throw error;
  }
};

export const SCurrentQueue = async () => {
  try {
    const counters = await prisma.counter.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        queues: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const result = counters.map((counter) => ({
      counterId: counter.id,
      counterName: counter.name,
      currentQueue: counter.currentQueue,
      maxQueue: counter.maxQueue,
      isActive: counter.isActive,
      lastQueue: counter.queues[0] || null,
    }));

    return {
      status: true,
      message: "Current queues retrieved successfully",
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

export const SSkipQueue = async (counterId: number) => {
  try {
    const existingCounter = await prisma.queue.findUnique({
      where: { id: counterId },
    });

    if (!existingCounter) {
      throw Error("Counter not found");
    }

    const currentQueue = await prisma.queue.findFirst({
      where: { counterId, status: "called" },
      orderBy: { createdAt: "asc" },
    });

    if (currentQueue) {
      await prisma.queue.update({
        where: { id: currentQueue.id },
        data: { status: "skipped" },
      });
    }

    const nextQueue = await prisma.queue.findFirst({
      where: { counterId, status: "claimed" },
      orderBy: { createdAt: "asc" },
    });

    if (!nextQueue) {
      throw Error("No more queues available");
    }

    const updatedQueue = await prisma.queue.update({
      where: { id: nextQueue.id },
      data: { status: "called" },
      include: { counter: true },
    });

    return {
      status: true,
      message: "Queue skipped successfully",
      data: updatedQueue,
    };
  } catch (error) {
    throw error;
  }
};

export const SResetQueue = async (counterId: number) => {
  try {
    if (counterId) {
      const counter = await prisma.counter.findUnique({
        where: { id: counterId },
      });

      if (!counter) {
        throw Error("Counter not found");
      }

      await prisma.queue.updateMany({
        where: { counterId: counterId, deletedAt: null },
        data: { status: "reset" },
      });

      await prisma.counter.update({
        where: { id: counterId },
        data: { currentQueue: 0 },
      });

      return {
        status: true,
        message: `Queues for counter ${counter.name} have been reset successfully`,
      };
    } else {
      await prisma.queue.updateMany({
        where: { deletedAt: null },
        data: { status: "reset" },
      });

      await prisma.counter.updateMany({
        where: { deletedAt: null },
        data: { currentQueue: 0 },
      });

      return {
        status: true,
        message: "All queues have been reset successfully",
      };
    }
  } catch (error) {
    throw error;
  }
};
