"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = withTransaction;
async function withTransaction(prisma, fn) {
    return await prisma.$transaction(async (tx) => {
        return await fn(tx);
    });
}
