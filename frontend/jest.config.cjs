module.exports = {
  testEnvironment: 'jsdom',

  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },

  roots: ['<rootDir>/src'],

  moduleFileExtensions: [
    'js',
    'json',
    'ts',
    'vue',
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.[jt]s$': 'babel-jest',
  },

  testMatch: [
    '**/__tests__/**/*.spec.[jt]s',
    '**/?(*.)+(spec|test).[jt]s',
  ],

  collectCoverageFrom: [
    'src/**/*.{js,ts,vue}',
    '!src/main.js',
    '!src/env.d.ts',
    '!src/types/**',
  ],

  coverageDirectory: 'coverage',

  coverageReporters: [
    'text',
    'html',
    'lcov',
  ],
}