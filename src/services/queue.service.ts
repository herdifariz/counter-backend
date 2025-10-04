import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { publishQueueUpdate } from "../config/redis.config";
import { IGlobalResponse } from "../interfaces/global.interface";

const prisma = new PrismaClient();

export const SGetMetrics = async (): Promise<IGlobalResponse> => {
  const waitingCount = await prisma.queue.count({
    where: { status: "CLAIMED" },
  });
  const calledCount = await prisma.queue.count({
    where: { status: "CALLED" },
  });
  const releasedCount = await prisma.queue.count({
    where: { status: "RELEASED" },
  });
  const skippedCount = await prisma.queue.count({
    where: { status: "SKIPPED" },
  });

  return {
    status: true,
    message: "Metrics retrieved successfully",
    data: {
      waiting: waitingCount,
      called: calledCount,
      released: releasedCount,
      skipped: skippedCount,
    },
  };
};

export const SClaimQueue = async (): Promise<IGlobalResponse> => {
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

  let nextQueueNumber = counter.currentQueue + 1;

  if (nextQueueNumber > counter.maxQueue) {
    nextQueueNumber = 1;
  }

  // Tentukan status awal queue
  const initialStatus = counter.currentQueue === 0 ? "CALLED" : "CLAIMED";

  const queue = await prisma.queue.create({
    data: {
      number: nextQueueNumber,
      status: initialStatus,
      counterId: counter.id,
    },
    include: {
      counter: true,
    },
  });

  // Jika ini antrian pertama, langsung update currentQueue
  if (initialStatus === "CALLED") {
    await prisma.counter.update({
      where: { id: counter.id },
      data: { currentQueue: queue.number },
    });

    await publishQueueUpdate({
      event: "queue_called",
      counter_id: counter.id,
      counter_name: counter.name,
      queue_number: queue.number,
    });
  } else {
    await publishQueueUpdate({
      event: "queue_claimed",
      counter_id: counter.id,
      counter_name: counter.name,
      queue_number: queue.number,
    });
  }

  // Hitung posisi antrean (untuk antrian pertama pasti 1)
  const queuesAhead = await prisma.queue.count({
    where: {
      counterId: counter.id,
      status: "CLAIMED",
      id: { lt: queue.id },
    },
  });

  const positionInQueue = initialStatus === "CALLED" ? 0 : queuesAhead + 1;

  const avgHandlingTimeMinutes = 5;
  const estimatedWaitTime = positionInQueue * avgHandlingTimeMinutes;

  return {
    status: true,
    message: "Queue claimed successfully",
    data: {
      queueNumber: queue.number,
      counterName: queue.counter.name,
      counterId: queue.counter.id,
      positionInQueue,
      estimatedWaitTime,
      status: queue.status,
    },
  };
};

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
      status: "CLAIMED",
    },
  });

  if (!queue) {
    throw AppError.notFound("Queue not found or already processed");
  }

  await prisma.queue.update({
    where: { id: queue.id },
    data: { status: "RELEASED" },
  });

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

  // Ambil queue yang sedang dipanggil (CALLED) untuk semua counter
  const calledQueues = await prisma.queue.findMany({
    where: {
      counterId: { in: counters.map((c) => c.id) },
      status: "CALLED",
    },
  });

  const data = counters.map((counter) => {
    const activeQueue = calledQueues.find((q) => q.counterId === counter.id);

    return {
      id: counter.id,
      name: counter.name,
      currentQueue: counter.currentQueue,
      maxQueue: counter.maxQueue,
      isActive: counter.isActive,
      status: activeQueue?.status || null,
    };
  });

  return {
    status: true,
    message: "Current queues retrieved successfully",
    data,
  };
};

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

  // 1️⃣ Cari antrean yang sedang dipanggil (CALLED)
  const calledQueue = await prisma.queue.findFirst({
    where: {
      counterId,
      status: "CALLED",
    },
    orderBy: { createdAt: "asc" },
  });

  if (calledQueue) {
    // Ubah antrean ini jadi SERVED
    await prisma.queue.update({
      where: { id: calledQueue.id },
      data: { status: "SERVED" },
    });

    await publishQueueUpdate({
      event: "queue_served",
      counter_id: counterId,
      queue_number: calledQueue.number,
      counter_name: counter.name,
    });
  }

  // 2️⃣ Cari antrean berikutnya (CLAIMED)
  const nextQueue = await prisma.queue.findFirst({
    where: {
      counterId,
      status: "CLAIMED",
    },
    orderBy: { createdAt: "asc" },
  });

  if (!nextQueue) {
    // Tidak ada antrean berikutnya → reset currentQueue
    await prisma.counter.update({
      where: { id: counterId },
      data: { currentQueue: 0 },
    });

    return {
      status: true,
      message: "No more queues to call",
      data: {
        counterId,
        counterName: counter.name,
        queueNumber: null,
      },
    };
  }

  // 3️⃣ Update antrean berikutnya jadi CALLED
  await prisma.queue.update({
    where: { id: nextQueue.id },
    data: { status: "CALLED" },
  });

  // Update counter.currentQueue
  await prisma.counter.update({
    where: { id: counterId },
    data: { currentQueue: nextQueue.number },
  });

  await publishQueueUpdate({
    event: "queue_called",
    counter_id: counterId,
    queue_number: nextQueue.number,
    counter_name: counter.name,
  });

  return {
    status: true,
    message: "Next queue called successfully",
    data: {
      queueNumber: nextQueue.number,
      counterName: counter.name,
      counterId,
    },
  };
};

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

  // 1️⃣ Cari antrean yang sedang dipanggil
  const calledQueue = await prisma.queue.findFirst({
    where: { counterId, status: "CALLED" },
    orderBy: { createdAt: "asc" },
  });

  if (!calledQueue) {
    throw AppError.notFound("No called queue found for this counter");
  }

  // Tandai antrean ini sebagai SKIPPED
  await prisma.queue.update({
    where: { id: calledQueue.id },
    data: { status: "SKIPPED" },
  });

  await publishQueueUpdate({
    event: "queue_skipped",
    counter_id: counterId,
    queue_number: calledQueue.number,
    counter_name: counter.name,
  });

  // 2️⃣ Cari antrean berikutnya (CLAIMED)
  const nextQueue = await prisma.queue.findFirst({
    where: { counterId, status: "CLAIMED" },
    orderBy: { createdAt: "asc" },
  });

  if (!nextQueue) {
    // Tidak ada antrean berikutnya → reset currentQueue
    await prisma.counter.update({
      where: { id: counterId },
      data: { currentQueue: 0 },
    });

    return {
      status: true,
      message: "Queue skipped, no more queues available",
      data: {
        counterId,
        counterName: counter.name,
        queueNumber: null,
      },
    };
  }

  // Update antrean berikutnya jadi CALLED
  await prisma.queue.update({
    where: { id: nextQueue.id },
    data: { status: "CALLED" },
  });

  // Update counter.currentQueue
  await prisma.counter.update({
    where: { id: counterId },
    data: { currentQueue: nextQueue.number },
  });

  await publishQueueUpdate({
    event: "queue_called",
    counter_id: counterId,
    queue_number: nextQueue.number,
    counter_name: counter.name,
  });

  return {
    status: true,
    message: "Queue skipped, next queue called",
    data: {
      queueNumber: nextQueue.number,
      counterName: counter.name,
      counterId,
    },
  };
};

export const SResetQueues = async (
  counterId?: number
): Promise<IGlobalResponse> => {
  if (counterId) {
    if (counterId <= 0) {
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

    await prisma.queue.updateMany({
      where: {
        counterId,
        status: { in: ["CLAIMED", "CALLED"] },
      },
      data: { status: "RESET" },
    });

    await prisma.counter.update({
      where: { id: counterId },
      data: { currentQueue: 0 },
    });

    await publishQueueUpdate({
      event: "queue_reset",
      counter_id: counterId,
    });

    return {
      status: true,
      message: `Queue for counter ${counter.name} reset successfully`,
    };
  } else {
    await prisma.queue.updateMany({
      where: {
        status: { in: ["CLAIMED", "CALLED"] },
        counter: {
          isActive: true,
          deletedAt: null,
        },
      },
      data: { status: "RESET" },
    });

    await prisma.counter.updateMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      data: { currentQueue: 0 },
    });

    await publishQueueUpdate({
      event: "all_queues_reset",
    });

    return {
      status: true,
      message: "All active queues reset successfully",
    };
  }
};

export const SSearchQueues = async (
  search?: string | null
): Promise<IGlobalResponse> => {
  const queues = await prisma.queue.findMany({
    where: {
      OR: [
        {
          number: isNaN(Number(search)) ? undefined : Number(search),
        },
        {
          counter: {
            name: {
              contains: search || undefined,
              mode: "insensitive",
            },
            deletedAt: null,
          },
        },
      ],
      counter: {
        isActive: true,
        deletedAt: null,
      },
    },
    include: {
      counter: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  const data = queues.map((queue) => ({
    id: queue.id,
    queueNumber: queue.number,
    status: queue.status,
    counter: {
      id: queue.counterId,
      name: queue.counter.name,
    },
    createdAt: queue.createdAt,
    updatedAt: queue.updatedAt,
  }));

  return {
    status: true,
    message: "Queues retrieved successfully",
    data,
  };
};
