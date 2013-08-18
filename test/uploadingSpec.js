var url = typeof window === 'undefined' ? 'http://example.org' : location.href;
var httpinvoke = require('../httpinvoke-node');

describe('"uploading" option', function() {
    this.timeout(10000);
    it('is called at least twice', function(done) {
        var count = 0;
        var abort = httpinvoke(url, {
            input: 'foobar',
            uploading: function() {
                count += 1;
                if(count === 2) {
                    done();
                }
            },
            finished: function() {
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
        httpinvoke(url, {
            input: 'foobar',
            uploading: function(current, total) {
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
                    return fail('"total" was not an integer');
                }
                if(total < 0) {
                    return fail('"total" was not an non-negative');
                }
            },
            finished: function() {
                if(done === null) {
                    return;
                }
                done();
            }
        });
    });
    it('has the last "current" be equal to total', function(done) {
        var current, total;
        httpinvoke(url, {
            input: 'foobar',
            uploading: function(_current, _total) {
                current = _current;
                total = _total;
            },
            finished: function() {
                if(current !== total) {
                    done(new Error('The last received "current"=' + current + ' is not equal to "total"=' + total));
                } else {
                    done();
                }
            }
        });
    });
    it('has the first "current" be equal to 0', function(done) {
        var abort = httpinvoke(url, {
            input: 'foobar',
            uploading: function(current) {
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
        httpinvoke(url, {
            input: 'foobar',
            uploading: function(current, total) {
                if(current > total) {
                    done(new Error('"current" was greater than "total"'));
                    done = null;
                }
            },
            finished: function() {
                if(done === null) {
                    return;
                }
                done();
            }
        });
    });
    it('has "total" always be the same', function(done) {
        var total = null;
        httpinvoke(url, {
            input: 'foobar',
            uploading: function(current, _total) {
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
            finished: function() {
                if(done === null) {
                    return;
                }
                done();
            }
        });
    });
    it('has "total" be equal to input length', function(done) {
        var input = 'foobar';
        var abort = httpinvoke(url, {
            input: input,
            uploading: function(_, total) {
                if(done === null) {
                    return;
                }
                if(input.length !== total) {
                    done(new Error('"total"=' + total + ' was not equal to input length = ' + input.length));
                } else {
                    done();
                }
                done = null;
                abort();
            }
        });
    });
    it('has "current" be non-decreasing', function(done) {
        var current = null;
        httpinvoke(url, {
            input: 'foobar',
            uploading: function(_current) {
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
            finished: function() {
                if(done === null) {
                    return;
                }
                done();
            }
        });
    });
});
