import type { JestConfigWithTsJest } from 'ts-jest';

import sharedConfig from '../../jest.config.base';

const jestConfig: JestConfigWithTsJest = {
  ...sharedConfig,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
};
export default jestConfig;
