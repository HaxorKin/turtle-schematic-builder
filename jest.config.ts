import { JestConfigWithTsJest } from 'ts-jest';

export default {
  testEnvironment: 'node',
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
} satisfies JestConfigWithTsJest;
