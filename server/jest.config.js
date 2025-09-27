module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/server/tests'],
  setupFilesAfterEnv: ['<rootDir>/server/tests/setup.js'],
  testTimeout: 30000
};
