// For a detailed explanation regarding each configuration property, visit:
// * https://jestjs.io/docs/en/configuration.html
// * https://kulshekhar.github.io/ts-jest/user/config/

export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['src'],
  collectCoverageFrom: ['src/**/{!(_public|index|testUtils),}.{ts,tsx}'],
};
