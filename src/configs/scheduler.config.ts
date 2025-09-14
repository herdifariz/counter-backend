import { PrismaClient } from "@prisma/client";
import * as cron from "node-cron";

const jobs = new Map<string, cron.ScheduledTask>();

const prisma = new PrismaClient();

export interface CleanupResult {
  deletedCount: number;
  message: string;
  timestamp: Date;
}

export interface FullCleanupResult {
  queueCleanup: CleanupResult;
  cacheCleanup: boolean;
}

const createCronTask = (
  expression: string,
  taskFunction: () => Promise<void>,
  timezone: string = "Asia/Jakarta"
): cron.ScheduledTask => {
  return cron.schedule(
    expression,
    async () => {
      try {
        await taskFunction();
      } catch (error) {
        console.error("Cron task failed:", error);
      }
    },
    { timezone }
  );
};

const calculateCutoffDate = (daysOld: number): Date => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  return cutoffDate;
};

export const cleanupExpiredQueues = async (
  daysOld: number = 1
): Promise<CleanupResult> => {
  try {
    const cutoffDate = calculateCutoffDate(daysOld);

    const deleteResult = await prisma.queue.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    const deletedCount = deleteResult.count;
    const message = `Successfully cleaned up ${deletedCount} expired queue entries`;

    console.log(`${message}`);

    return {
      deletedCount,
      message,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error during queue cleanup:", error);
    throw new Error(
      `Queue cleanup failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

const scheduleQueueCleanup = (): void => {
  const taskFunction = async () => {
    console.log("Running scheduled queue cleanup...");
    const result = await cleanupExpiredQueues(1); // Hapus data lebih dari 1 hari
    console.log("Cleanup results:", result);
  };

  const task = createCronTask("0 2 * * *", taskFunction);
  jobs.set("queueCleanup", task);
  console.log("Queue cleanup job scheduled: Every day at 02:00 (Asia/Jakarta)");
};

export const initializeCronJobs = (): void => {
  console.log("Initializing cron jobs...");

  scheduleQueueCleanup();

  console.log("All cron jobs initialized successfully");
};
