module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Restrict Jest to only look in the current server directory
  rootDir: ".",
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  collectCoverageFrom: ["<rootDir>/src/**/*.{ts,js}"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Mock ioredis for testing
    "^ioredis$": "<rootDir>/src/tests/mocks/redis.mock.js",
  },
  setupFiles: ["<rootDir>/.jest/setEnvVars.js"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup/globalSetup.js"],
  // Prevent Jest from scanning outside our project directory
  roots: ["<rootDir>/src"], // Only look for modules in src directory
  // Explicitly ignore other workspace directories
  testPathIgnorePatterns: [
    "/node_modules/",
    "/home/scotianog/ai-engine/",
    "/home/scotianog/the-soless-system/",
    "/home/scotianog/soless-presale-site/app/", // Even ignore the app directory
  ],
  modulePathIgnorePatterns: [
    "/home/scotianog/ai-engine/",
    "/home/scotianog/the-soless-system/",
    "/home/scotianog/soless-presale-site/app/",
  ],
  // Integration test optimizations
  maxWorkers: 1, // Run tests sequentially to avoid database connection issues
  testTimeout: 60000, // 60 second timeout for integration tests
  forceExit: true, // Force exit after tests complete
  detectOpenHandles: true, // Help identify what's keeping the process alive
  workerIdleMemoryLimit: "1GB", // Restart workers if they use too much memory
};
