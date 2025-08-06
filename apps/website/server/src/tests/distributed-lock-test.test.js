"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DistributedLock_1 = require("../core/utils/DistributedLock");
describe("DistributedLock Test", () => {
    let lock1;
    let lock2;
    let lock3;
    beforeEach(() => {
        lock1 = new DistributedLock_1.DistributedLock();
        lock2 = new DistributedLock_1.DistributedLock();
        lock3 = new DistributedLock_1.DistributedLock();
    });
    test("should handle concurrent lock acquisitions properly", async () => {
        const lockKey = "test-lock";
        const lockOptions = { ttl: 5000 };
        console.log("Test: Starting concurrent lock acquisition test");
        // Try to acquire the same lock concurrently
        const promises = [
            lock1.acquire(lockKey, lockOptions).then((result) => {
                console.log("Test: Lock1 result:", result ? "SUCCESS" : "FAILED");
                return result;
            }),
            lock2.acquire(lockKey, lockOptions).then((result) => {
                console.log("Test: Lock2 result:", result ? "SUCCESS" : "FAILED");
                return result;
            }),
            lock3.acquire(lockKey, lockOptions).then((result) => {
                console.log("Test: Lock3 result:", result ? "SUCCESS" : "FAILED");
                return result;
            }),
        ];
        const results = await Promise.all(promises);
        console.log("Test: All lock results:", results);
        // Only one should succeed
        const successes = results.filter((r) => r !== null);
        const failures = results.filter((r) => r === null);
        console.log(`Test: ${successes.length} successes, ${failures.length} failures`);
        expect(successes.length).toBe(1);
        expect(failures.length).toBe(2);
        // Release the successful lock
        const successfulLockValue = successes[0];
        if (successfulLockValue) {
            // Determine which lock succeeded and release it
            const lockIndex = results.findIndex((r) => r === successfulLockValue);
            const successfulLock = [lock1, lock2, lock3][lockIndex];
            await successfulLock.release(lockKey, successfulLockValue);
            console.log("Test: Released successful lock");
        }
    });
});
