window._httpinvoke = window.httpinvoke;
window._cfg = {
    host: location.hostname,
    port: location.port || (location.protocol === 'https:' ? 443 : 80),
    path: '/dummyserver/'
};
window._cfg.corsURL = 'http://' + window._cfg.host + ':1337/';
window._cfg.url = 'http://' + window._cfg.host + ':' + window._cfg.port + window._cfg.path;
window.require = function(module) {
    if(module === '../dummyserver-config') {
        return window._cfg;
    }
    return window._httpinvoke;
};
