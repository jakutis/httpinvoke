var cfg = require('./karma-mocha-requireHack');

// overridding basic
cfg.host = '0.0.0.0';
cfg.port = cfg.dummyserverPort;
cfg.path = '/';
// generated
cfg.url = 'http://' + cfg.host + ':' + cfg.port + cfg.path;
cfg.corsURL = cfg.url;

module.exports = cfg;
