// For a detailed explanation regarding each configuration property, visit:
// * https://jestjs.io/docs/en/configuration.html
// * https://kulshekhar.github.io/ts-jest/user/config/

export default {
  testEnvironment: 'jsdom',
  roots: ['src'],
  collectCoverageFrom: ['src/**/{!(index|testUtils),}.{ts,tsx}'],
  preset: 'ts-jest',
  setupFilesAfterEnv: ['jest-extended/all'],
};
