/** @type {import('jest').Config} */
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transformIgnorePatterns: [
    "node_modules/(?!(bullmq|msgpackr|@google/genai|uuid|ioredis)/)"
  ],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@shared/(.*)$": "<rootDir>/shared/$1",
    "^@/(.*)$": "<rootDir>/client/src/$1",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          jsx: "react-jsx"
        }
      },
    ],
  },
  testMatch: [
    "<rootDir>/tests/**/*.test.ts",
    "<rootDir>/tests/**/*.test.tsx",
    "<rootDir>/tests/**/*.spec.ts",
    "<rootDir>/tests/**/*.spec.tsx",
  ],
  collectCoverageFrom: [
    "server/**/*.ts",
    "client/src/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/*.test.{ts,tsx}",
    "!**/*.spec.{ts,tsx}",
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testTimeout: 30000,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
