import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { IGlobalResponse } from "../interfaces/global.interface";

const prisma = new PrismaClient();

/**
 * Service to get all counters (excluding deleted ones)
 */
export const SGetAllCounters = async (
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    status: true,
    message: "Counters retrieved successfully",
    data: counters,
  };
};

/**
 * Service to get a counter by ID
 */
export const SGetCounterById = async (id: number): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  return {
    status: true,
    message: "Counter retrieved successfully",
    data: counter,
  };
};

/**
 * Service to create a new counter
 */
export const SCreateCounter = async (
  name: string,
  maxQueue: number
): Promise<IGlobalResponse> => {
  // Validate input
  if (!name || name.trim().length === 0) {
    throw AppError.badRequest("Counter name is required");
  }

  if (maxQueue < 1 || maxQueue > 999) {
    throw AppError.badRequest("Max queue must be between 1 and 999");
  }

  // Check if counter with same name exists (including deleted ones)
  const existingCounter = await prisma.counter.findFirst({
    where: {
      name: name.trim(),
      deletedAt: null,
    },
  });

  if (existingCounter) {
    throw AppError.conflict("Counter with this name already exists");
  }

  const counter = await prisma.counter.create({
    data: {
      name: name.trim(),
      maxQueue,
      currentQueue: 0,
      isActive: true,
    },
  });

  return {
    status: true,
    message: "Counter created successfully",
    data: counter,
  };
};

/**
 * Service to update a counter
 */
export const SUpdateCounter = async (
  id: number,
  name?: string,
  maxQueue?: number,
  isActive?: boolean
): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  // Validate input if provided
  if (name !== undefined) {
    if (!name || name.trim().length === 0) {
      throw AppError.badRequest("Counter name is required");
    }

    // Check if name is already taken by another counter
    const existingCounter = await prisma.counter.findFirst({
      where: {
        name: name.trim(),
        deletedAt: null,
        NOT: { id },
      },
    });
    if (existingCounter) {
      throw AppError.conflict("Counter with this name already exists");
    }
  }

  if (maxQueue !== undefined && (maxQueue < 1 || maxQueue > 999)) {
    throw AppError.badRequest("Max queue must be between 1 and 999");
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (name !== undefined) updateData.name = name.trim();
  if (maxQueue !== undefined) updateData.maxQueue = maxQueue;
  if (isActive !== undefined) updateData.isActive = isActive;

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

/**
 * Service to delete a counter (soft delete)
 */
export const SDeleteCounter = async (id: number): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  // Check if counter has associated active queues
  const activeQueueCount = await prisma.queue.count({
    where: {
      counterId: id,
      status: { in: ["claimed", "called"] },
    },
  });

  if (activeQueueCount > 0) {
    throw AppError.conflict("Cannot delete counter with active queues");
  }

  // Soft delete
  await prisma.counter.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedAt: new Date(),
    },
  });

  return {
    status: true,
    message: "Counter deleted successfully",
  };
};

/**
 * Service to toggle counter active status
 */
export const SToggleCounterStatus = async (
  id: number
): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  const updatedCounter = await prisma.counter.update({
    where: { id },
    data: {
      isActive: !counter.isActive,
      updatedAt: new Date(),
    },
  });

  return {
    status: true,
    message: `Counter ${
      updatedCounter.isActive ? "activated" : "deactivated"
    } successfully`,
    data: updatedCounter,
  };
};
