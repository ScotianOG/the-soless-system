"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegistrationStatus = getRegistrationStatus;
const REGISTRATION_CONFIG = {
    START_DATE: '2024-02-01T00:00:00Z',
    get MAINTENANCE_MODE() {
        return process.env.MAINTENANCE_MODE === 'true';
    }
};
async function getRegistrationStatus(prisma) {
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
}
function getClosedReason(isWithinTimeWindow, isNotInMaintenance) {
    if (!isWithinTimeWindow) {
        return "Registration has not started yet";
    }
    if (!isNotInMaintenance) {
        return "System is currently under maintenance";
    }
    return "Registration is currently closed";
}
