var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

var arraysEqual = function(a, b) {
    'use strict';
    if(a.length !== b.length) {
        return false;
    }
    for(var i = 0; i < a.length; i += 1) {
        if(a[i] !== b[i]) {
            return false;
        }
    }
    return true;
};

describe('"downloading" option', function() {
    'use strict';
    this.timeout(10000);
    var urls = [];
    cfg.eachBase(function(postfix, url, crossDomain) {
        urls.push({
            postfix: postfix,
            url: url,
            crossDomain: crossDomain
        });
        urls.push({
            postfix: postfix + ' (deflate)',
            url: url + 'contentEncoding/deflate',
            crossDomain: crossDomain
        });
        urls.push({
            postfix: postfix + ' (gzip)',
            url: url + 'contentEncoding/gzip',
            crossDomain: crossDomain
        });
        urls.push({
            postfix: postfix + ' (noentity)',
            url: url + 'noentity',
            crossDomain: crossDomain
        });
    });
    cfg.eachBase(function(postfix, url) {
        ['chunked', 'joined'].forEach(function(partial) {
            it('has argument "partial", if option "partialOutputMode" is set to "' + partial + '"' + postfix, function(done) {
                httpinvoke(url + 'big', {
                    partialOutputMode: partial,
                    downloading: function(current, total, partial) {
                        if(typeof partial !== 'string' && typeof partial !== 'object') {
                            done(new Error('partial is neither string, nor object'));
                            done = null;
                            return;
                        }
                    },
                    finished: function(err) {
                        if(!done) {
                            return;
                        }
                        if(err) {
                            return done(err);
                        }
                        done();
                    }
                });
            });
        });
        it('has the concatenated values of argument "partial" equal to "output", when "partialOutputMode" is "chunked" and "outputType" is "text"' + postfix, function(done) {
            var partials = '';
            httpinvoke(url + 'big', {
                partialOutputMode: 'chunked',
                outputType: 'text',
                downloading: function(current, total, partial) {
                    partials += partial;
                },
                finished: function(err, output) {
                    if(!done) {
                        return;
                    }
                    if(err) {
                        return done(err);
                    }
                    if(partials !== output) {
                        return done(new Error('Concatenated values of argument "partial" is not equal to output'));
                    }
                    done();
                }
            });
        });
        it('has the concatenated values of argument "partial" equal to "output", when "partialOutputMode" is "chunked" and "outputType" is "bytearray"' + postfix, function(done) {
            var partials = [];
            httpinvoke(url + 'big', {
                partialOutputMode: 'chunked',
                outputType: 'bytearray',
                downloading: function(current, total, partial) {
                    partials = partials.concat([].slice.call(partial));
                },
                finished: function(err, output) {
                    if(!done) {
                        return;
                    }
                    if(err) {
                        return done(err);
                    }
                    if(!arraysEqual(output, partials)) {
                        return done(new Error('Concatenated values of argument "partial" is not equal to output'));
                    }
                    done();
                }
            });
        });
        it('has argument "partial" on the last call equal to "output", when "partialOutputMode" is "joined" and "outputType" is "text"' + postfix, function(done) {
            var lastPartial;
            httpinvoke(url + 'big', {
                partialOutputMode: 'joined',
                outputType: 'text',
                downloading: function(current, total, partial) {
                    lastPartial = partial;
                },
                finished: function(err, output) {
                    if(!done) {
                        return;
                    }
                    if(err) {
                        return done(err);
                    }
                    if(lastPartial !== output) {
                        return done(new Error('Last partial is not equal to output'));
                    }
                    done();
                }
            });
        });
        it('has argument "partial" on the last call equal to "output", when "partialOutputMode" is "joined" and "outputType" is "bytearray"' + postfix, function(done) {
            var lastPartial;
            httpinvoke(url + 'big', {
                partialOutputMode: 'joined',
                outputType: 'bytearray',
                downloading: function(current, total, partial) {
                    lastPartial = partial;
                },
                finished: function(err, output) {
                    if(!done) {
                        return;
                    }
                    if(err) {
                        return done(err);
                    }
                    if(!arraysEqual(output, lastPartial)) {
                        return done(new Error('Last partial is not equal to output'));
                    }
                    done();
                }
            });
        });
    });
    urls.forEach(function(url) {
        var postfix = url.postfix;
        url = url.url;
        it('is called at least twice' + postfix, function(done) {
            var count = 0;
            httpinvoke(url, {
                downloading: function() {
                    count += 1;
                },
                finished: function(err) {
                    if(err) {
                        return done(err);
                    }
                    if(count < 2) {
                        done(new Error('It was called ' + count + ' times'));
                    }
                    done();
                }
            });
        });
        it('has total be 0, if there is no entity body' + postfix, function(done) {
            var total;
            httpinvoke(url, 'POST', {
                downloading: function(_, _total) {
                    total = _total;
                },
                finished: function(err, output) {
                    if(err) {
                        return done(err);
                    }
                    if(typeof output === 'undefined' && total !== 0) {
                        return done(new Error('total is not 0'));
                    }
                    done();
                }
            });
        });
        it('has the last total be always defined' + postfix, function(done) {
            var defined = false;
            httpinvoke(url, {
                downloading: function(_, total) {
                    defined = typeof total !== 'undefined';
                },
                finished: function(err) {
                    if(err) {
                        return done(err);
                    }
                    if(!defined) {
                        return done(new Error('Last total is not defined'));
                    }
                    done();
                }
            });
        });
        it('has total be always defined, after first time' + postfix, function(done) {
            var defined = false;
            httpinvoke(url, {
                downloading: function(_, total) {
                    if(typeof total !== 'undefined') {
                        defined = true;
                    } else if(defined) {
                        done(new Error('became undefined after was defined'));
                        done = null;
                    }
                },
                finished: function(err) {
                    if(done === null) {
                        return;
                    }
                    if(err) {
                        return done(err);
                    }
                    done();
                }
            });
        });
        it('has "current" and "total" be non-negative integers' + postfix, function(done) {
            var fail = function(msg) {
                done(new Error(msg));
                done = null;
            };
            httpinvoke(url, {
                downloading: function(current, total) {
                    if(typeof total === 'undefined') {
                        return;
                    }
                    if(done === null) {
                        return;
                    }
                    if(typeof current !== 'number') {
                        return fail('"current" was not a number');
                    }
                    if(current % 1 !== 0) {
                        return fail('"current" was not an integer');
                    }
                    if(current < 0) {
                        return fail('"current" was not an non-negative');
                    }
                    if(typeof total !== 'number') {
                        return fail('"total" was not a number');
                    }
                    if(total % 1 !== 0) {
                        return fail('"total" was not an integer, because the result of (total % 1) is ' + (total % 1));
                    }
                    if(total < 0) {
                        return fail('"total" was not an non-negative');
                    }
                },
                finished: function(err) {
                    if(done === null) {
                        return;
                    }
                    if(err) {
                        return done(err);
                    }
                    done();
                }
            });
        });
        it('has the last "current" be equal to total' + postfix, function(done) {
            var current, total;
            httpinvoke(url, {
                downloading: function(_current, _total) {
                    current = _current;
                    total = _total;
                },
                finished: function(err) {
                    if(err) {
                        return done(err);
                    }
                    if(current !== total) {
                        done(new Error('The last received "current"=' + current + ' is not equal to "total"=' + total));
                    } else {
                        done();
                    }
                }
            });
        });
        it('has the first "current" be equal to 0' + postfix, function(done) {
            var abort = httpinvoke(url, {
                downloading: function(current) {
                    if(done === null) {
                        return;
                    }
                    if(current !== 0) {
                        done(new Error('First "current" is not equal to 0: ' + current));
                    } else {
                        done();
                    }
                    done = null;
                    abort();
                }
            });
        });
        it('has "current" not greater than "total"' + postfix, function(done) {
            httpinvoke(url, {
                downloading: function(current, total) {
                    if(current > total) {
                        done(new Error('"current" was greater than "total"'));
                        done = null;
                    }
                },
                finished: function(err) {
                    if(done === null) {
                        return;
                    }
                    if(err) {
                        return done(err);
                    }
                    done();
                }
            });
        });
        it('has "total" always be the same' + postfix, function(done) {
            var total = null;
            httpinvoke(url, {
                downloading: function(current, _total) {
                    if(typeof _total === 'undefined') {
                        return;
                    }
                    if(done === null) {
                        return;
                    }
                    if(total === null) {
                        total = _total;
                        return;
                    }
                    if(total !== _total) {
                        done(new Error('Received "total"=' + _total + ' that is different from previously received "total"=' + total));
                        done = null;
                    }
                },
                finished: function(err) {
                    if(done === null) {
                        return;
                    }
                    if(err) {
                        return done(err);
                    }
                    done();
                }
            });
        });
        it('has "current" be non-decreasing' + postfix, function(done) {
            var current = null;
            httpinvoke(url, {
                downloading: function(_current) {
                    if(done === null) {
                        return;
                    }
                    if(current === null) {
                        current = _current;
                        return;
                    }
                    if(_current < current) {
                        done(new Error('Received "current"=' + _current + ' that is lower than previously received "current"=' + current));
                        done = null;
                    }
                },
                finished: function(err) {
                    if(done === null) {
                        return;
                    }
                    if(err) {
                        return done(err);
                    }
                    done();
                }
            });
        });
    });
});
