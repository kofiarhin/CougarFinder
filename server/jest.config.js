module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  collectCoverageFrom: ['<rootDir>/**/*.js', '!<rootDir>/tests/**', '!<rootDir>/jest.config.js']
};
