var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

function isValidReason(reason) {
    'use strict';
    return typeof reason === 'object' && reason !== null && reason instanceof Error;
}

function isValidResponse(response, crossDomain) {
    'use strict';
    return typeof response === 'object' && typeof response.body === 'string' && (typeof response.statusCode === 'number' || !(!crossDomain || httpinvoke.corsStatus)) && typeof response.headers === 'object';
}

function isValidProgress(progress, crossDomain) {
    'use strict';
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
        if((!crossDomain || httpinvoke.corsStatus) && typeof progress.statusCode !== 'number') {
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

describe('promise', function() {
    'use strict';
    this.timeout(10000);
    cfg.eachBase(function(postfix, url, crossDomain) {
        it('supports Promises/A' + postfix, function(done) {
            var promise = httpinvoke(url).then(function(response) {
                if(!done) {
                    return;
                }
                if(isValidResponse(response, crossDomain)) {
                    done();
                } else {
                    done(new Error('invalid response ' + JSON.stringify(response)));
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
                if(!isValidProgress(progress, crossDomain)) {
                    done(new Error('invalid progress ' + JSON.stringify(progress)));
                    done = null;
                }
            });
            if(typeof promise.then !== 'function') {
                done(new Error('then() did not return a promise'));
                done = null;
            }
        });
        it('supports skipping onresolved' + postfix, function(done) {
            httpinvoke(url, {
                finished: done
            }).then(null, function() {
            }, function() {
            });
        });
        it('supports skipping onrejected' + postfix, function(done) {
            httpinvoke('foo:bar', {
                finished: function(err) {
                    if(!err) {
                        return done(new Error('expected error'));
                    }
                    done();
                }
            }).then(function() {
            }, null, function() {
            });
        });
        it('supports Promises/A+ requirement, that callbacks must be called as functions' + postfix, function(done) {
            httpinvoke(url).then(function() {
                if(!done) {
                    return;
                }
                if(this !== global && this !== null) {
                    done(new Error('onResolved was not called as a function'));
                    done = null;
                    return;
                }
                httpinvoke(url, 'ERROR').then(function() {
                }, function() {
                    if(!done) {
                        return;
                    }
                    if(this !== global && this !== null) {
                        done(new Error('onRejected was not called as a function'));
                        done = null;
                        return;
                    }
                    done();
                });
            }, function() {
            }, function() {
                if(!done) {
                    return;
                }
                if(this !== global && this !== null) {
                    done(new Error('onProgress was not called as a function'));
                    done = null;
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
                if(!isValidResponse(response, crossDomain)) {
                    done(new Error('invalid response ' + JSON.stringify(response)));
                }
                done();
            }, null);
        });
        it('supports Promises/A+ requirement, that If onResolved returns a value x, returned promise must be resolved using x' + postfix, function(done) {
            var value = {};
            httpinvoke(url).then(function() {
                return value;
            }).then(function(v) {
                if(value !== v) {
                    done(new Error('was not resolved with same value'));
                }
                done();
            }, function() {
                done(new Error('was rejected'));
            });
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
        it('supports Promises/A+ requirement, that If onRejected returns a value x, returned promise must be resolved using x' + postfix, function(done) {
            var value = {};
            httpinvoke(url, 'ERROR').then(null, function() {
                return value;
            }).then(function(v) {
                if(value !== v) {
                    done(new Error('was not resolved with the same value'));
                }
                done();
            }, function() {
                done(new Error('was rejected'));
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
        ['chunked', 'joined'].forEach(function(partial) {
            it('supports .partial in "download" progress event, when option "partialOutputMode" is set to "' + partial + '"' + postfix, function(done) {
                httpinvoke(url, {
                    partialOutputMode: partial
                }).then(function() {
                    if(!done) {
                        return;
                    }
                    done();
                    done = null;
                }, function(err) {
                    if(!done) {
                        return;
                    }
                    done(err);
                    done = null;
                }, function(progress) {
                    if(!isValidProgress(progress, crossDomain)) {
                        done(new Error('invalid progress'));
                        done = null;
                        return;
                    }
                    if(progress.type === 'download' && typeof progress.partial !== 'string' && typeof progress.partial !== 'object') {
                        done(new Error('progress.partial is neither string, nor object'));
                        done = null;
                        return;
                    }
                });
            });
        });
    });
});
