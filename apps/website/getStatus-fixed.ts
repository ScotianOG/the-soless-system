// src/routes/registration/getStatus.ts
import { PrismaClient } from "@prisma/client";
import { RegistrationStatus } from "./types";

const REGISTRATION_CONFIG = {
  START_DATE: "2024-02-01T00:00:00Z",
  get MAINTENANCE_MODE() {
    return process.env.MAINTENANCE_MODE === "true";
  },
};

export async function getRegistrationStatus(
  prisma: PrismaClient
): Promise<RegistrationStatus> {
  try {
    // Add null check for prisma
    if (!prisma || !prisma.user) {
      throw new Error("Database connection not available");
    }

    const totalUsers = await prisma.user.count();
    const now = new Date();
    const startDate = new Date(REGISTRATION_CONFIG.START_DATE);

    const isWithinTimeWindow = now >= startDate;
    const isNotInMaintenance = !REGISTRATION_CONFIG.MAINTENANCE_MODE;
    const isOpen = isWithinTimeWindow && isNotInMaintenance;

    return {
      isOpen,
      totalRegistrations: totalUsers,
      registrationPeriod: {
        start: startDate.toISOString(),
      },
      currentTime: now.toISOString(),
      maintenanceMode: REGISTRATION_CONFIG.MAINTENANCE_MODE,
      reason: !isOpen
        ? getClosedReason(isWithinTimeWindow, isNotInMaintenance)
        : null,
    };
  } catch (error) {
    console.error("Database error in getRegistrationStatus:", error);
    // Return a fallback status if database is unavailable
    const now = new Date();
    const startDate = new Date(REGISTRATION_CONFIG.START_DATE);

    return {
      isOpen: false,
      totalRegistrations: 0,
      registrationPeriod: {
        start: startDate.toISOString(),
      },
      currentTime: now.toISOString(),
      maintenanceMode: true,
      reason: "Database connection issue - please try again later",
    };
  }
}

function getClosedReason(
  isWithinTimeWindow: boolean,
  isNotInMaintenance: boolean
): string {
  if (!isWithinTimeWindow) {
    return "Registration has not started yet";
  }
  if (!isNotInMaintenance) {
    return "System is currently under maintenance";
  }
  return "Registration is currently closed";
}
