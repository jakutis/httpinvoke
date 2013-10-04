var cfg = require('./karma-mocha-requireHack');

// overridding basic
cfg.host = '0.0.0.0';
// generated
cfg.url = 'http://' + cfg.host + ':' + cfg.dummyserverPort + '/';
cfg.corsURL = cfg.url;

module.exports = cfg;
