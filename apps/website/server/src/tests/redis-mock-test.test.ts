const Redis = require("ioredis");

describe("Redis Mock Test", () => {
  let redis: any;

  beforeEach(() => {
    redis = new Redis();
  });

  afterEach(async () => {
    await redis.disconnect();
  });

  test("should handle concurrent NX operations", async () => {
    const key = "test:concurrent";
    const promises = [];

    // Create 3 concurrent set operations
    for (let i = 0; i < 3; i++) {
      promises.push(redis.set(key, `value${i}`, "PX", 5000, "NX"));
    }

    const results = await Promise.all(promises);
    console.log("Concurrent results:", results);

    // Only one should succeed (return "OK"), others should return null
    const successes = results.filter((r: any) => r === "OK");
    const failures = results.filter((r: any) => r === null);

    console.log("Successes:", successes.length, "Failures:", failures.length);
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(2);
  });
});
