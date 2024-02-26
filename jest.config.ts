export default {
  preset: 'ts-jest',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/node_modules/'],
  rootDir: 'src',
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|js)$',
  transform: {
    '.ts': 'ts-jest',
  },
  moduleNameMapper: {
    '^axios$': 'axios/dist/node/axios.cjs',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  bail: true,
  maxWorkers: 1,
  testTimeout: 3000000,
};
