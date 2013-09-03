var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"downloading" option', function() {
    this.timeout(10000);
    // TODO do all of these tests for various binary and variously encoded text responses
    it('is called at least twice', function(done) {
        var count = 0;
        var abort = httpinvoke(cfg.url, {
            downloading: function() {
                count += 1;
                if(count === 2) {
                    done();
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
                if(count < 2) {
                    done(new Error('It was called ' + count + ' times'));
                }
                abort();
            }
        });
    });
    it('has "current" and "total" be non-negative integers', function(done) {
        var fail = function(msg) {
            done(new Error(msg));
            done = null;
        };
        httpinvoke(cfg.url, {
            downloading: function(current, total) {
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
    it('has the last "current" be equal to total', function(done) {
        var current, total;
        httpinvoke(cfg.url, {
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
    it('has the first "current" be equal to 0', function(done) {
        var abort = httpinvoke(cfg.url, {
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
    it('has "current" not greater than "total"', function(done) {
        httpinvoke(cfg.url, {
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
    it('has "total" always be the same', function(done) {
        var total = null;
        httpinvoke(cfg.url, {
            downloading: function(current, _total) {
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
    it('has "total" be equal to output length', function(done) {
        var total = null;
        httpinvoke(cfg.url, {
            downloading: function(_, _total) {
                total = _total;
            },
            finished: function(err, output) {
                if(err) {
                    return done(err);
                }
                if(output.length !== total) {
                    done(new Error('"total"=' + total + ' was not equal to output length = ' + output.length));
                } else {
                    done();
                }
            }
        });
    });
    it('has "current" be non-decreasing', function(done) {
        var current = null;
        httpinvoke(cfg.url, {
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
