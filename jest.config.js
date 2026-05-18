/** @type {import('jest').Config} */
const config = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'lib/utils/**/*.ts',
    'lib/types/**/*.ts',
    'lib/database/**/*.ts',
    'lib/notifications/**/*.ts',
    '!lib/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 60,
    },
  },
};

module.exports = config;
