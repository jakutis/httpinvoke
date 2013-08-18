var cfg = {
    host: '127.0.0.1',
    port: 1337, // when changing here, change also in ./mocha-requireHack.js
    path: '/'
};
cfg.url = 'http://' + cfg.host + ':' + cfg.port + cfg.path;
cfg.corsURL = cfg.url;

module.exports = cfg;
