var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"downloading" option', function() {
    this.timeout(10000);
    cfg.eachBase(function(postfix, url, crossDomain) {
        it('is called at least twice' + postfix, function(done) {
            var count = 0;
            var abort = httpinvoke(url, {
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
        it('has total be 0, if there is no entity body' + postfix, function(done) {
            httpinvoke(url + 'noentity', 'POST', {
                downloading: function(_, total) {
                    if(done === null) {
                        return;
                    }
                    if(typeof total === 'undefined') {
                        return;
                    }
                    if(total !== 0) {
                        done(new Error('total is not 0'));
                        done = null;
                    }
                },
                finished: function(err, output) {
                    if(done === null) {
                        return;
                    }
                    if(err) {
                        return done(err);
                    }
                    if(typeof output !== 'undefined') {
                        return done(new Error('Output is not undefined'));
                    }
                    done();
                }
            });
        });
        it('has the last total be always defined' + postfix, function(done) {
            var defined = false;
            var abort = httpinvoke(url, {
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
            var abort = httpinvoke(url, {
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
        it('has the last "total" be equal to output length, when outputType="bytearray"' + postfix, function(done) {
            var total = null;
            httpinvoke(url, {
                outputType: 'bytearray',
                downloading: function(_, _total) {
                    total = _total;
                },
                finished: function(err, output) {
                    if(err) {
                        return done(err);
                    }
                    if(output.length !== total) {
                        done(new Error('The last "total"=' + total + ' was not equal to output length = ' + output.length));
                    } else {
                        done();
                    }
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
