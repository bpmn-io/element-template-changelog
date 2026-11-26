import bpmnIoPlugin from 'eslint-plugin-bpmn-io';

const files = {
  ignored: [
    'tmp'
  ],
  build: [
    '*.cjs',
    '*.js'
  ],
  test: [
    'test/**/*.js'
  ]
};

export default [
  {
    ignores: files.ignored
  },

  // build
  ...bpmnIoPlugin.configs.node.map((config) => {
    return {
      ...config,
      files: files.build
    };
  }),

  {
    files: files.build,
    languageOptions: {
      ecmaVersion: 2025
    }
  },

  // lib + test
  ...bpmnIoPlugin.configs.browser.map((config) => {
    return {
      ...config,
      ignores: files.build
    };
  }),

  // test
  ...bpmnIoPlugin.configs.mocha.map((config) => {
    return {
      ...config,
      files: files.test
    };
  })
];