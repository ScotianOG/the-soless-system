"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startContest = startContest;
async function startContest(prisma, params) {
    // End any active contests
    await prisma.contest.updateMany({
        where: { status: "ACTIVE" },
        data: { status: "COMPLETED" },
    });
    // Create new contest
    return prisma.contest.create({
        data: {
            name: params.name,
            startTime: new Date(),
            endTime: new Date(params.endTime),
            status: "ACTIVE",
            rules: params.rules || {},
        },
    });
}
