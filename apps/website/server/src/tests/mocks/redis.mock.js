// Redis mock for Jest testing environment
// This prevents Redis connection errors during tests

class MockRedis {
  constructor() {
    // Use shared data across all MockRedis instances to simulate a real Redis server
    if (!MockRedis.sharedData) {
      MockRedis.sharedData = new Map();
      MockRedis.sharedTimers = new Map();
      MockRedis.sharedOperationQueue = Promise.resolve();
    }
    this.data = MockRedis.sharedData;
    this.timers = MockRedis.sharedTimers;
    this.operationQueue = MockRedis.sharedOperationQueue;
    this.connected = true;
  }

  // Static method to reset shared state between tests
  static resetSharedState() {
    MockRedis.sharedData = new Map();
    MockRedis.sharedTimers = new Map();
    MockRedis.sharedOperationQueue = Promise.resolve();
  }

  // Connection methods
  async connect() {
    this.connected = true;
    return Promise.resolve();
  }

  async disconnect() {
    this.connected = false;
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    return Promise.resolve();
  }

  // Basic Redis commands
  async get(key) {
    if (!this.connected) throw new Error("Redis not connected");
    const value = this.data.get(key);
    return value || null;
  }

  async set(key, value, ...args) {
    // Queue this operation to ensure atomicity using shared queue
    MockRedis.sharedOperationQueue = MockRedis.sharedOperationQueue.then(
      async () => {
        if (!this.connected) throw new Error("Redis not connected");

        // Handle SET with PX (expiration in milliseconds) and NX (only if not exists)
        let ttl = null;
        let onlyIfNotExists = false;

        for (let i = 0; i < args.length; i++) {
          if (args[i] === "PX" && i + 1 < args.length) {
            ttl = parseInt(args[i + 1]);
            i++; // Skip the next argument
          } else if (args[i] === "NX") {
            onlyIfNotExists = true;
          }
        }

        // For NX operations, we need to check and set atomically
        if (onlyIfNotExists) {
          if (this.data.has(key)) {
            return null; // Key already exists - return null for NX failure
          }
        }

        this.data.set(key, value);

        // Set expiration timer if TTL is specified
        if (ttl) {
          // Clear existing timer for this key
          if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
          }

          const timer = setTimeout(() => {
            this.data.delete(key);
            this.timers.delete(key);
          }, ttl);

          this.timers.set(key, timer);
        }

        return "OK"; // Return "OK" only when the set operation succeeds
      }
    );
    return MockRedis.sharedOperationQueue;
  }

  async del(key) {
    if (!this.connected) throw new Error("Redis not connected");

    // Clear timer if exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    const existed = this.data.has(key);
    this.data.delete(key);
    return existed ? 1 : 0;
  }

  async pexpire(key, milliseconds) {
    if (!this.connected) throw new Error("Redis not connected");

    if (!this.data.has(key)) {
      return 0; // Key doesn't exist
    }

    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.data.delete(key);
      this.timers.delete(key);
    }, milliseconds);

    this.timers.set(key, timer);
    return 1;
  }

  // Lua script evaluation (used by DistributedLock)
  async eval(script, numKeys, ...args) {
    if (!this.connected) throw new Error("Redis not connected");

    const keys = args.slice(0, numKeys);
    const argv = args.slice(numKeys);

    // Mock the lock release script
    if (script.includes('redis.call("get", KEYS[1]) == ARGV[1]')) {
      const key = keys[0];
      const expectedValue = argv[0];
      const currentValue = this.data.get(key);

      if (currentValue === expectedValue) {
        return this.del(key);
      } else {
        return 0;
      }
    }

    // Mock the lock extend script
    if (script.includes('redis.call("pexpire", KEYS[1], ARGV[2])')) {
      const key = keys[0];
      const expectedValue = argv[0];
      const ttl = parseInt(argv[1]);
      const currentValue = this.data.get(key);

      if (currentValue === expectedValue) {
        return this.pexpire(key, ttl);
      } else {
        return 0;
      }
    }

    // Default: return 0 for unknown scripts
    return 0;
  }

  // Event emitter methods (for error handling)
  on(event, callback) {
    // Mock event listener - do nothing in tests
    return this;
  }

  off(event, callback) {
    // Mock event listener removal - do nothing in tests
    return this;
  }

  // Additional Redis commands that might be used
  async exists(key) {
    if (!this.connected) throw new Error("Redis not connected");
    return this.data.has(key) ? 1 : 0;
  }

  async ttl(key) {
    if (!this.connected) throw new Error("Redis not connected");
    // Return -1 for keys that exist but have no expiration
    // Return -2 for keys that don't exist
    // For simplicity, always return -1 if key exists
    return this.data.has(key) ? -1 : -2;
  }

  async flushall() {
    if (!this.connected) throw new Error("Redis not connected");
    this.data.clear();
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    return "OK";
  }
}

// Mock the ioredis module
const mockRedisInstance = new MockRedis();

const mockIoRedis = jest.fn(() => mockRedisInstance);
mockIoRedis.mockImplementation(() => mockRedisInstance);

// Export the mock
module.exports = mockIoRedis;
module.exports.default = mockIoRedis;
module.exports.Redis = mockIoRedis;
module.exports.__mockInstance = mockRedisInstance;
