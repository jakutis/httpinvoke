var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('promise', function() {
    this.timeout(10000);
    cfg.eachBase(function(postfix, url) {
        it('supports Promises/A' + postfix, function(done) {
            var promise = httpinvoke(url).then(function(response) {
                if(!done) {
                    return;
                }
                if(isValidResponse(response)) {
                    done();
                } else {
                    done(new Error('invalid response'));
                }
            }, function(error) {
                if(!done) {
                    return;
                }
                done(error);
            }, function(progress) {
                if(!done) {
                    return;
                }
                if(!isValidProgress(progress)) {
                    done(new Error('invalid progress'));
                    done = null;
                }
            });
            if(typeof promise.then !== 'function') {
                done(new Error('then() did not return a promise'));
                done = null;
            }
        });
        it('supports Promises/A+ requirement, that callbacks must be called as functions' + postfix, function(done) {
            httpinvoke(url).then(function() {
                if(!done) {
                    return;
                }
                if(this !== global) {
                    done = null;
                    return done(new Error('onResolved was not called as a function'));
                }
                httpinvoke(url, 'ERROR').then(function() {
                }, function(err) {
                    if(!done) {
                        return;
                    }
                    if(this !== global) {
                        done = null;
                        return done(new Error('onRejected was not called as a function'));
                    }
                    done();
                });
            }, function() {
            }, function() {
                if(!done) {
                    return;
                }
                if(this !== global) {
                    done = null;
                    return done(new Error('onProgress was not called as a function'));
                }
            });
        });
        it('supports Promises/A+ requirement, that If onResolved is not a function, it must be ignored' + postfix, function(done) {
            httpinvoke(url, 'ERROR').then(null, function(err) {
                if(!isValidReason(err)) {
                    return done(new Error('invalid reason'));
                }
                done();
            });
        });
        it('supports Promises/A+ requirement, that If onRejected is not a function, it must be ignored' + postfix, function(done) {
            httpinvoke(url).then(function(response) {
                if(!isValidResponse(response)) {
                    done(new Error('invalid response'));
                }
                done();
            }, null);
        });
        it('supports Promises/A+ requirement, that If onResolved throws an exception e, returned promise must be rejected with e as the reason' + postfix, function(done) {
            var e = {};
            httpinvoke(url).then(function() {
                throw e;
            }).then(function() {
                done(new Error('was not rejected'));
            }, function(err) {
                if(err !== e) {
                    done(new Error('was not rejected with same reason'));
                }
                done();
            });
        });
        it('supports Promises/A+ requirement, that If onRejected throws an exception e, returned promise must be rejected with e as the reason' + postfix, function(done) {
            var e = {};
            httpinvoke(url, 'ERROR').then(null, function() {
                throw e;
            }).then(function() {
                done(new Error('was not rejected'));
            }, function(err) {
                if(err !== e) {
                    done(new Error('was not rejected with same reason'));
                }
                done();
            });
        });
        it('supports a requirement, that If onNotify throws an exception e, returned promise must be rejected with e as the reason' + postfix, function(done) {
            var e = {};
            httpinvoke(url).then(null, null, function() {
                throw e;
            }).then(function() {
                done(new Error('was not rejected'));
            }, function(err) {
                if(err !== e) {
                    done(new Error('was not rejected with same reason'));
                }
                done();
            });
        });
        it('supports a requirement, that If onResolved is not a function and the original promise is resolved, the returned promise must be resolved with the same value' + postfix, function(done) {
            var output;
            httpinvoke(url, function(err, _output) {
                output = _output;
            }).then().then(function(res) {
                if(output !== res.body) {
                    return done(new Error('the passed value is not the same'));
                }
                done();
            });
        });
        it('supports a requirement, that If onRejected is not a function and the original promise is rejected, the returned promise must be rejected with the same reason' + postfix, function(done) {
            var err;
            httpinvoke(url, 'ERROR', function(_err) {
                err = _err;
            }).then().then(null, function(_err) {
                if(err !== _err) {
                    return done(new Error('the passed reason is not the same'));
                }
                done();
            });
        });
    });
});

function isValidReason(reason) {
    return typeof reason === 'object' && reason !== null && reason instanceof Error;
}

function isValidResponse(response) {
    return typeof response === 'object' && typeof response.body === 'string' && typeof response.statusCode === 'number' && typeof response.headers === 'object';
}

function isValidProgress(progress) {
    if(typeof progress !== 'object' || typeof progress.type !== 'string') {
        return false;
    }
    if(progress.type === 'upload') {
        if(typeof progress.current !== 'number') {
            return false;
        }
        if(typeof progress.total !== 'number') {
            return false;
        }
        if(progress.current > progress.total) {
            return false;
        }
    } else if(progress.type === 'download') {
        if(typeof progress.current !== 'number') {
            return false;
        }
        if(typeof progress.total === 'number') {
            if(progress.current > progress.total) {
                return false;
            }
        }
    } else if(progress.type === 'headers') {
        if(typeof progress.statusCode !== 'number') {
            return false;
        }
        if(typeof progress.headers !== 'object') {
            return false;
        }
        if(typeof progress.headers['content-type'] !== 'string') {
            return false;
        }
    } else if(progress.type === 'body') {
        if(typeof progress.statusCode !== 'number') {
            return false;
        }
        if(typeof progress.headers !== 'object') {
            return false;
        }
        if(typeof progress.headers['content-type'] !== 'string') {
            return false;
        }
        if(typeof progress.body !== 'string') {
            return false;
        }
    } else {
        return false;
    }
    return true;
}
