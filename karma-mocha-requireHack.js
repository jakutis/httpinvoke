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
    /* # Statuses from RFC 2616
     *
     * ## Not tested statuses, with reasons
     *
     * 100 Continue: technical status, not semantic, irrelevant for practical use
     * 101 Switching Protocols: technical status, not semantic, irrelevant for practical use
     * 401 Unauthorized: Chrome 29.0 throws an authorization dialog, when the mandatory header 'WWW-Authenticate' is set
     * 407 Proxy Authentication Required: not useful, Chrome 29.0 sends "some type" of network error
     * 411 Length Required: Content-Length is always sent by browsers
     * 417 Expectation Failed: the required header 'Expect' is not allowed by browsers
     *
     * ## Statuses that should work, but should not be used, with reasons
     *
     * 3XX 4XX 5XX:
     * - Opera <12.00, Firefox <4.0 send "some type" of network error
     *
     * 408 GET:
     * - Firefox 24.0 sends "some type" of network error
     *
     * 300 GET with Location header set:
     * - same-origin: Firefox 24.0 sends "some type" of network error
     * - cross-origin: Firefox 24.0 redirects
     *
     * 301, 302, 303, 307 with Location header set:
     * - cross-origin: "some type" of network error
     * - GET same-origin: Chrome 29.0 redirects
     * - POST same-origin: Chrome 29.0 times out
     *
     * 305 GET with Location:
     * - Safari 5.1 sends "some type" of network error
     *
     * 301, 302, 303, 307 GET same-origin without Location header set:
     * - IE 8.0 returns status 12150, which is WinInet error code ERROR_HTTP_HEADER_NOT_FOUND The requested header could not be located.
     *
     * Fails ("write EPIPE" error) on node:
     * - 301, 302, 303, 307 POST without location header set
     *
     * Broken by proxy of Karma test runner:
     * - same-origin 300, 305 POST
     * - 412, 413, 414, 415
     */
    status: {
        // OK
        '200': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: true
            }]
        },
        // Created
        '201': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: true
            }]
        },
        // Accepted
        '202': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: true
            }]
        },
        // Non-Authoritative Information
        '203': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: true
            }]
        },
        // No Content
        '204': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Reset Content
        '205': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Partial Content
        '206': {
            GET: [{
                requestEntity: false,
                partialResponse: true,
                responseEntity: true
            }]
        },
        // Multiple Choices
        '300': {
            GET: [{
                name: 'without location',
                location: false,
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Not Modified
        '304': {
            GET: [{
                ifModified: true,
                location: false,
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Use Proxy
        '305': {
            GET: [{
                name: 'without location',
                location: false,
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Bad Request
        '400': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Payment Required
        '402': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Forbidden
        '403': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Not Found
        '404': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Method Not Allowed
        '405': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Not Acceptable
        '406': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Conflict
        '409': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Gone
        '410': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Requested Range Not Satisfiable
        '416': {
            GET: [{
                requestEntity: false,
                partialResponse: true,
                responseEntity: false
            }]
        },
        // Internal Server Error
        '500': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Not Implemented
        '501': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Bad Gateway
        '502': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Service Unavailable
        '503': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // Gateway Timeout
        '504': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        },
        // HTTP Version Not Supported
        '505': {
            GET: [{
                requestEntity: false,
                partialResponse: false,
                responseEntity: false
            }]
        }
    },
    makeTextFinished: function(done) {
        var cfg = require('./dummyserver-config');
        return function(err, output) {
            if(err) {
                return done(err);
            }
            if(typeof output !== 'string') {
                return done(new Error('Received output is not a string'));
            }
            if(output !== cfg.textTest()) {
                return done(new Error('Received output ' + output + ' is not equal to expected output ' + cfg.textTest()));
            }
            done();
        };
    },
    makeByteArrayFinished: function(done) {
        var cfg = require('./dummyserver-config');
        return function(err, output) {
            if(err) {
                return done(err);
            }
            var expected = cfg.bytearrayTest();
            if(typeof output !== 'object' || output === null) {
                return done(new Error('Received output is not a non-null object'));
            }
            if(output.length !== expected.length) {
                return done(new Error('Received output length ' + output.length + ' is not equal to expected output length ' + expected.length));
            }
            var failures = [];
            for(var i = 0; i < output.length; i += 1) {
                if(output[i] !== expected[i]) {
                    failures.push(i + 'th byte: ' + output[i] + ' !== ' + expected[i]);
                }
            }
            if(failures.length > 0) {
                return done(new Error('Some received bytes differ from expected: ' + failures.join(',')));
            }
            done();
        };
    },
    eachBase: function(fn) {
        var httpinvoke = require('./httpinvoke-node');
        if(httpinvoke.cors) {
            try {
                fn(' (cross-origin)', window._cfg.corsURL, true);
            } catch(_) {
            }
        }
        try {
            fn(' (same-origin)', window._cfg.url, false);
        } catch(_) {
        }
    },
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
        for(i = 255; i >= 0; i -= 1) {
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
    if(module === '../dummyserver-config' || module === './dummyserver-config') {
        return window._cfg;
    }
    return window._httpinvoke;
};

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = window._cfg;
}
