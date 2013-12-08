var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"status" argument', function() {
    'use strict';
    this.timeout(10000);
    cfg.eachBase(function(postfix, url, crossDomain) {
        if(crossDomain && !httpinvoke.corsStatus) {
            return;
        }
        Object.keys(cfg.status).forEach(function(code) {
            if((!crossDomain && code === '206') || (crossDomain && code === '304')) {
                // failure on Opera (various versions, e.g. 12.10), maybe Karma test runner failure
                return;
            }
            Object.keys(cfg.status[code]).forEach(function(method) {
                if(method === 'PATCH' && !httpinvoke.PATCH) {
                    return;
                }
                cfg.status[code][method].forEach(function(params, i) {
                    var _postfix = postfix;
                    if(typeof params.name !== 'undefined') {
                        _postfix += ' (' + params.name + ')';
                    } else if(cfg.status[code][method].length > 1) {
                        _postfix += ' (' + i + ')';
                    }
                    it('supports ' + code + ' ' + method + _postfix, function(done) {
                        var hello = 'Hello World\n';
                        var opts = {
                            headers: {},
                            corsExposedHeaders: [],
                            finished: function(err, output) {
                                if(err) {
                                    return done(err);
                                }
                                if(params.responseEntity) {
                                    if(params.partialResponse) {
                                        if(output !== hello.substr(0, 5)) {
                                            return done(new Error('unexpected output ' + output));
                                        }
                                    } else {
                                        if(output !== hello) {
                                            return done(new Error('unexpected output'));
                                        }
                                    }
                                } else {
                                    if(typeof output !== 'undefined') {
                                        return done(new Error('output was not expected, but received ' + output));
                                    }
                                }
                                done();
                            }
                        };
                        if(params.location) {
                            opts.corsExposedHeaders.push('Location');
                        }
                        if(params.requestEntity) {
                            opts.input = 'Hello World\n';
                        }
                        if(params.partialResponse) {
                            opts.corsExposedHeaders.push('Content-Range');
                            opts.headers.Range = 'bytes=0-4';
                        }
                        if(params.ifModified) {
                            opts.headers['If-Modified-Since'] = 'Thu, 01 Jan 1970 00:00:00 GMT';
                        }
                        httpinvoke(url + i + '/status/' + code, method, opts);
                    });
                });
            });
        });
    });
});
