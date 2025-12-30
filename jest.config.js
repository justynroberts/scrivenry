const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/tests/features.test.ts', // E2E tests run separately
    '<rootDir>/tests/setup.ts',
  ],
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'app/api/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    // Editor components require TipTap context - tested via E2E
    '!components/editor/**/*.{js,jsx,ts,tsx}',
    // Sidebar requires complex state - tested via E2E
    '!components/sidebar/**/*.{js,jsx,ts,tsx}',
    // Database/auth modules require live DB - tested via E2E
    '!lib/db/**/*.{js,jsx,ts,tsx}',
    '!lib/auth.ts',
    // API routes requiring database/auth - tested via E2E
    '!app/api/pages/**/*.{js,jsx,ts,tsx}',
    '!app/api/workspace/**/*.{js,jsx,ts,tsx}',
    '!app/api/user/**/*.{js,jsx,ts,tsx}',
    '!app/api/v1/**/*.{js,jsx,ts,tsx}',
    '!app/api/ai/stream/**/*.{js,jsx,ts,tsx}',
    '!app/api/auth/**/*.{js,jsx,ts,tsx}',
    '!app/api/favorites/**/*.{js,jsx,ts,tsx}',
    '!app/api/api-keys/**/*.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(spec|test).[jt]s?(x)',
    '**/*.(spec|test).[jt]s?(x)',
  ],
}

module.exports = createJestConfig(customJestConfig)
