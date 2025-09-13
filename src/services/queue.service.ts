import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { publishQueueUpdate } from "../config/redis";
import { IGlobalResponse } from "../interfaces/global.interface";

const prisma = new PrismaClient();

/**
 * Service to claim a new queue number
 */
export const SClaimQueue = async (): Promise<IGlobalResponse> => {
  // Get an active counter with the lowest current queue number
  const counter = await prisma.counter.findFirst({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: { currentQueue: "asc" },
  });

  if (!counter) {
    throw AppError.notFound("No active counters found");
  }

  // Calculate the next queue number
  let nextQueueNumber = counter.currentQueue + 1;

  // Reset to 1 if max queue is reached
  if (nextQueueNumber > counter.maxQueue) {
    nextQueueNumber = 1;
  }

  // Create a new queue entry
  const queue = await prisma.queue.create({
    data: {
      number: nextQueueNumber,
      status: "claimed",
      counterId: counter.id,
    },
    include: {
      counter: true,
    },
  });

  // Update the counter's current queue
  await prisma.counter.update({
    where: { id: counter.id },
    data: { currentQueue: nextQueueNumber },
  });

  // Publish update to Redis for real-time notifications
  await publishQueueUpdate({
    event: "queue_claimed",
    counter_id: counter.id,
    counter_name: counter.name,
    queue_number: nextQueueNumber,
  });

  return {
    status: true,
    message: "Queue claimed successfully",
    data: {
      queueNumber: queue.number,
      counterName: queue.counter.name,
      counterId: queue.counter.id,
    },
  };
};

/**
 * Service to release a queue
 */
export const SReleaseQueue = async (
  queueNumber: number,
  counterId: number
): Promise<IGlobalResponse> => {
  if (!queueNumber || queueNumber <= 0) {
    throw AppError.badRequest("Invalid queue number", null, "queueNumber");
  }

  if (!counterId || counterId <= 0) {
    throw AppError.badRequest("Invalid counter ID", null, "counterId");
  }

  // Validate counter exists and is active
  const counter = await prisma.counter.findUnique({
    where: {
      id: counterId,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  if (!counter.isActive) {
    throw AppError.badRequest("Counter is not active", null, "counterId");
  }

  const queue = await prisma.queue.findFirst({
    where: {
      number: queueNumber,
      counterId: counterId,
      status: "claimed",
    },
  });

  if (!queue) {
    throw AppError.notFound("Queue not found or already processed");
  }

  // Update queue status to 'released'
  await prisma.queue.update({
    where: { id: queue.id },
    data: { status: "released" },
  });

  // Publish update to Redis
  await publishQueueUpdate({
    event: "queue_released",
    counter_id: counterId,
    queue_number: queueNumber,
  });

  return {
    status: true,
    message: "Queue released successfully",
  };
};

/**
 * Service to get current status of all counters
 */
export const SGetCurrentQueues = async (
  includeInactive: boolean = false
): Promise<IGlobalResponse> => {
  const whereCondition: any = {
    deletedAt: null,
  };

  if (!includeInactive) {
    whereCondition.isActive = true;
  }

  const counters = await prisma.counter.findMany({
    where: whereCondition,
    orderBy: { name: "asc" },
  });

  const data = counters.map((counter) => ({
    id: counter.id,
    name: counter.name,
    currentQueue: counter.currentQueue,
    maxQueue: counter.maxQueue,
    isActive: counter.isActive,
  }));

  return {
    status: true,
    message: "Current queues retrieved successfully",
    data,
  };
};

/**
 * Service to call next queue for a counter
 */
export const SNextQueue = async (
  counterId: number
): Promise<IGlobalResponse> => {
  if (!counterId || counterId <= 0) {
    throw AppError.badRequest("Invalid counter ID", null, "counterId");
  }

  const counter = await prisma.counter.findUnique({
    where: {
      id: counterId,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  if (!counter.isActive) {
    throw AppError.badRequest("Counter is not active", null, "counterId");
  }

  // Find the latest queue with 'claimed' status for this counter
  const claimedQueue = await prisma.queue.findFirst({
    where: {
      counterId,
      status: "claimed",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!claimedQueue) {
    throw AppError.notFound("No claimed queues found for this counter");
  }

  // Update queue status to 'called'
  await prisma.queue.update({
    where: { id: claimedQueue.id },
    data: { status: "called" },
  });

  // Publish update to Redis
  await publishQueueUpdate({
    event: "queue_called",
    counter_id: counterId,
    queue_number: claimedQueue.number,
    counter_name: counter.name,
  });

  return {
    status: true,
    message: "Next queue called successfully",
    data: {
      queueNumber: claimedQueue.number,
      counterName: counter.name,
      counterId,
    },
  };
};

/**
 * Service to skip current queue for a counter
 */
export const SSkipQueue = async (
  counterId: number
): Promise<IGlobalResponse> => {
  if (!counterId || counterId <= 0) {
    throw AppError.badRequest("Invalid counter ID", null, "counterId");
  }

  const counter = await prisma.counter.findUnique({
    where: {
      id: counterId,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  if (!counter.isActive) {
    throw AppError.badRequest("Counter is not active", null, "counterId");
  }

  // Find the currently called queue
  const calledQueue = await prisma.queue.findFirst({
    where: {
      counterId,
      status: "called",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!calledQueue) {
    throw AppError.notFound("No called queue found for this counter");
  }

  // Update queue status to 'skipped'
  await prisma.queue.update({
    where: { id: calledQueue.id },
    data: { status: "skipped" },
  });

  // Publish update to Redis
  await publishQueueUpdate({
    event: "queue_skipped",
    counter_id: counterId,
    queue_number: calledQueue.number,
  });

  // Try to call next queue if available
  try {
    const nextQueueResult = await SNextQueue(counterId);
    return {
      status: true,
      message: "Queue skipped successfully and next queue called",
      data: nextQueueResult.data,
    };
  } catch (error) {
    console.warn("No more queues to call after skip:", error);
    // Return success even if there are no more queues to call
    return {
      status: true,
      message: "Queue skipped successfully, no more queues to call",
    };
  }
};

/**
 * Service to reset queues for a counter or all counters
 */
export const SResetQueues = async (
  counterId?: number
): Promise<IGlobalResponse> => {
  if (counterId) {
    if (counterId <= 0) {
      throw AppError.badRequest("Invalid counter ID", null, "counterId");
    }

    // Reset specific counter
    const counter = await prisma.counter.findUnique({
      where: {
        id: counterId,
        deletedAt: null,
      },
    });

    if (!counter) {
      throw AppError.notFound("Counter not found");
    }

    if (!counter.isActive) {
      throw AppError.badRequest("Counter is not active", null, "counterId");
    }

    // Update all active queues for this counter to 'reset'
    await prisma.queue.updateMany({
      where: {
        counterId,
        status: { in: ["claimed", "called"] },
      },
      data: { status: "reset" },
    });

    // Reset counter's current queue to 0
    await prisma.counter.update({
      where: { id: counterId },
      data: { currentQueue: 0 },
    });

    // Publish update to Redis
    await publishQueueUpdate({
      event: "queue_reset",
      counter_id: counterId,
    });

    return {
      status: true,
      message: `Queue for counter ${counter.name} reset successfully`,
    };
  } else {
    // Reset all active counters only
    // Update all active queues to 'reset' for active counters only
    await prisma.queue.updateMany({
      where: {
        status: { in: ["claimed", "called"] },
        counter: {
          isActive: true,
          deletedAt: null,
        },
      },
      data: { status: "reset" },
    });

    // Reset only active counters to 0
    await prisma.counter.updateMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      data: { currentQueue: 0 },
    });

    // Publish update to Redis
    await publishQueueUpdate({
      event: "all_queues_reset",
    });

    return {
      status: true,
      message: "All active queues reset successfully",
    };
  }
};
