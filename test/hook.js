var httpinvoke = require('../httpinvoke-node');
var cfg = require('../dummyserver-config');

describe('hook', function() {
    'use strict';
    this.timeout(10000);
    var hookAndVerifier = function(done) {
        var verified = false;
        var r = [Math.random()];
        return {
            hook: function() {
                return r;
            },
            verifier: function() {
                if(verified) {
                    return;
                }
                verified = true;
                if(arguments.length !== r.length) {
                    return done(new Error('received argument length ' + arguments.length + ' is not equal to the modified ' + r.length));
                }
                if(r.some(function(v, i) {
                    return this[i] !== v;
                }, arguments)) {
                    return done(new Error('received argument did not match the modified'));
                }
                done();
            }
        };
    };

    it('is a function', function(done) {
        if(typeof httpinvoke.hook !== 'function') {
            return done(new Error('is not a function'));
        }
        done();
    });
    it('throws when type is not a string', function(done) {
        try {
            httpinvoke.hook(123, function() {});
            return done(new Error('did not throw'));
        } catch(err) {
            done();
        }
    });
    it('throws when type is not supported', function(done) {
        try {
            httpinvoke.hook('foobar', function() {});
            return done(new Error('did not throw'));
        } catch(err) {
            done();
        }
    });
    it('throws when hook is not a function', function(done) {
        try {
            httpinvoke.hook('finished', 123);
            return done(new Error('did not throw'));
        } catch(err) {
            done();
        }
    });
    it('returns a function that is not the same as httpinvoke', function(done) {
        var h = httpinvoke.hook('finished', function() {
        });
        if(typeof h !== 'function') {
            return done(new Error('did not return a function'));
        }
        if(h === httpinvoke) {
            return done(new Error('returned httpinvoke'));
        }
        done();
    });
    cfg.eachBase(function(postfix, url) {
        it('lets the finish hook reject promise and also pass the response object' + postfix, function(done) {
            httpinvoke.hook('finished', function(err, output, statusCode, headers) {
                if(err) {
                    return arguments;
                }
                if(statusCode >= 400 && statusCode <= 599) {
                    return [new Error('Server or client error - HTTP status ' + statusCode), output, statusCode, headers];
                }
                return arguments;
            })(url + 'foobar').then(null, function(err, res) {
                if(res.statusCode !== 404) {
                    return done(new Error('response object status is not equal to 404'));
                }
                done();
            });
        });
        ['finished', 'downloading', 'uploading', 'gotStatus'].forEach(function(type) {
            it('lets the ' + type + ' hook modify arguments' + postfix, function(done) {
                var hv = hookAndVerifier(done);
                var opts = {};
                opts[type] = hv.verifier;
                httpinvoke.hook(type, hv.hook)(url, opts);
            });
            it('lets the ' + type + ' hook throw an error and reject the promise' + postfix, function(done) {
                var err = new Error();
                httpinvoke.hook(type, function() {
                    throw err;
                })(url).then(function() {
                    done(new Error('promise was not rejected'));
                }, function(_err) {
                    if(_err) {
                        if(err === _err) {
                            done();
                        } else {
                            done(new Error('the received error is not the same as the thrown'));
                        }
                    } else {
                        done(new Error('did not receive an error'+[].slice.call(arguments)));
                    }
                });
            });
            it('lets the ' + type + ' hook throw an error and pass it to finished callback' + postfix, function(done) {
                var err = new Error();
                httpinvoke.hook(type, function() {
                    throw err;
                })(url, function(_err) {
                    if(_err) {
                        if(err === _err) {
                            done();
                        } else {
                            done(new Error('the received error is not the same as the thrown'));
                        }
                    } else {
                        done(new Error('did not receive an error'+[].slice.call(arguments)));
                    }
                });
            });
        });
    });
});
