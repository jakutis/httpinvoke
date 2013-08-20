if(typeof window === 'undefined') {
    window = {};
}
if(typeof location === 'undefined') {
    location = {};
}

window._httpinvoke = window.httpinvoke;

// basic
window._cfg = {
    dummyserverPort: 1337,
    host: location.hostname,
    port: location.port || (location.protocol === 'https:' ? 443 : 80),
    path: '/dummyserver/'
};
// generated
window._cfg.corsURL = 'http://' + window._cfg.host + ':' + window._cfg.dummyserverPort + '/';
window._cfg.url = 'http://' + window._cfg.host + ':' + window._cfg.port + window._cfg.path;

window.require = function(module) {
    if(module === '../dummyserver-config') {
        return window._cfg;
    }
    return window._httpinvoke;
};

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = window._cfg;
}
