export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  verbose: true,
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        diagnostics: {
          ignoreCodes: [151002],
        },
        tsconfig: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          esModuleInterop: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
