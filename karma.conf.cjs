var path = require('path');

var fs = require('fs');

// allows to raise the mocha test timeout on slow environments
var testTimeout = process.env.TEST_TIMEOUT;

// configures browsers to run test against
// any of [ 'ChromeHeadless', 'Chrome', 'Firefox', 'FirefoxHeadless' ]
var browsers = (process.env.TEST_BROWSERS || 'ChromeHeadless').split(',');

// runs the playground, cf. `npm start`
var singleStart = process.env.SINGLE_START;

var tmpDir = path.join(__dirname, 'tmp');

fs.mkdirSync(tmpDir, { recursive: true });

var firefoxProfile = fs.mkdtempSync(path.join(tmpDir, 'firefox-profile'));


module.exports = function(karma) {
  var config = {

    frameworks: [
      'mocha',
      'webpack'
    ],

    files: [
      'test/testBundle.js'
    ],

    preprocessors: {
      'test/testBundle.js': [ 'webpack', 'env' ]
    },

    reporters: [ 'tldr' ],

    customLaunchers: {
      'FirefoxHeadless': {
        base: 'Firefox',
        flags: [ '-headless' ],
        profile: firefoxProfile
      }
    },

    browsers,

    client: {
      mocha: testTimeout ? { timeout: parseInt(testTimeout, 10) } : {}
    },

    browserNoActivityTimeout: 30000,

    autoWatch: false,
    singleRun: true,

    webpack: {
      mode: 'development',
      target: 'browserslist:last 2 versions, not dead',
      module: {
        rules: [
          {
            test: /\.(css|bpmn)$/,
            type: 'asset/source'
          }
        ]
      },
      devtool: 'eval-source-map'
    }
  };

  if (singleStart) {
    config.browsers = [].concat(config.browsers, 'Debug');
    config.envPreprocessor = [ 'SINGLE_START' ];
  }

  karma.set(config);
};
