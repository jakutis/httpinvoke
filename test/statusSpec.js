var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"status" argument', function() {
    this.timeout(10000);
    cfg.eachBase(function(postfix, url, crossDomain) {
        if(crossDomain && !httpinvoke.corsStatus) {
            return;
        }
        Object.keys(cfg.status).forEach(function(code) {
            Object.keys(cfg.status[code]).forEach(function(method) {
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
                            corsHeaders: [],
                            finished: function(err, output, status, headers) {
                                if(err) {
                                    return done(err);
                                }
                                if(status !== Number(code)) {
                                    return done(new Error('status is not ' + code + ', but ' + status));
                                }
                                if(params.location) {
                                    if(typeof headers.location === 'undefined') {
                                        return done(new Error('Location header is not defined'));
                                    }
                                }
                                if(params.responseEntity) {
                                    if(headers['content-type'] !== 'text/plain') {
                                        return done(new Error('unexpected Content-Type'));
                                    }
                                    if(params.partialResponse) {
                                        if(output !== hello.substr(0, 5)) {
                                            return done(new Error('unexpected output ' + output));
                                        }
                                        if(headers['content-range'] !== 'bytes 0-4/' + hello.length) {
                                            return done(new Error('unexpected Content-Range ' + headers['content-range']));
                                        }
                                    } else {
                                        if(output !== hello) {
                                            return done(new Error('unexpected output'));
                                        }
                                    }
                                } else {
                                    if(typeof output !== 'undefined') {
                                        return done(new Error('output is not undefined'));
                                    }
                                    if(typeof headers['content-type'] !== 'undefined') {
                                        return done(new Error('Content-Type is undefined'));
                                    }
                                }
                                done();
                            }
                        };
                        if(params.location) {
                            opts.corsHeaders.push('Location');
                        }
                        if(params.requestEntity) {
                            opts.input = 'Hello World\n';
                        }
                        if(params.partialResponse) {
                            opts.corsHeaders.push('Content-Range');
                            opts.headers.Range = 'bytes=0-4';
                        }
                        if(params.ifModified) {
                            opts.headers['If-Modified-Since'] = 'Thu, 01 Jan 1970 00:00:00 GMT';
                        }
                        httpinvoke(url + '/' + i + '/status/' + code, method, opts);
                    });
                });
            });
        });
    });
});
