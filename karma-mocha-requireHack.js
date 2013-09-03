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
    path: '/dummyserver/',
    jsonTest: function() {
        return [{
            a: 0,
            b: false,
            c: 'false',
            d: null
        }];
    },
    jsonTestPasses: function(json) {
        if(typeof json !== 'object' || json === null) {
            return false;
        }
        if(!(json instanceof Array)) {
            return false;
        }
        if(typeof json[0] !== 'object' || json === null) {
            return false;
        }
        if(!(json[0] instanceof Object)) {
            return false;
        }
        if(json[0].a !== 0) {
            return false;
        }
        if(json[0].b !== false) {
            return false;
        }
        if(json[0].c !== 'false') {
            return false;
        }
        if(json[0].d !== null) {
            return false;
        }
        return true;
    },
    textTest: function() {
        return 'ąčęėįšųū„“–ž1234567890-=!@#$%^&*()_+´¬¿,./;[]';
    },
    bytearrayTest: function() {
        var i, bytes = [];
        for(i = 0; i < 64; i += 1) {
            bytes.push(0);
        }
        for(i = 255; i > 0; i -= 1) {
            bytes.push(i);
        }
        for(i = 0; i <= 255; i += 1) {
            bytes.push(i);
        }
        return bytes;
    }
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
