var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"uploading" option', function() {
    'use strict';
    this.timeout(10000);
    var input, inputs = [];

    inputs.push({
        name: 'undefined',
        inputLength: 0
    });

    if(global.FormData) {
        inputs.push({
            name: 'formdata',
            inputType: 'formdata',
            input: new global.FormData()
        });
    }

    input = 'foobar';
    inputs.push({
        name: 'text',
        inputType: 'text',
        input: input,
        inputLength: input.length
    });

    if(!httpinvoke.requestTextOnly) {
        input = cfg.bytearrayTest();
        inputs.push({
            name: 'bytearray',
            inputType: 'bytearray',
            input: input,
            inputLength: input.length
        });
    }

    var eachInput = function(fn) {
        var _undefined;
        for(var input = 0; input < inputs.length; input += 1) {
            fn(inputs[input].inputType, inputs[input].input, inputs[input].inputLength, inputs[input].name);
            fn('auto', inputs[input].input, inputs[input].inputLength, inputs[input].name);
            fn(_undefined, inputs[input].input, inputs[input].inputLength, inputs[input].name);
        }
    };
    cfg.eachBase(function(_postfix, url) {
        eachInput(function(inputType, input, inputLength, name) {
            var postfix = _postfix + ' (' + name + '-' + inputType + ')';
            it('is called at least twice' + postfix, function(done) {
                var count = 0;
                httpinvoke(url, 'POST', {
                    inputType: inputType,
                    input: input,
                    uploading: function() {
                        count += 1;
                        if(count === 2) {
                            done();
                        }
                    },
                    finished: function(err) {
                        if(err) {
                            return done(err);
                        }
                        if(count < 2) {
                            done(new Error('It was called ' + count + ' times'));
                        }
                    }
                });
            });
            it('has "current" and "total" be non-negative integers' + postfix, function(done) {
                var fail = function(msg) {
                    done(new Error(msg));
                    done = null;
                };
                httpinvoke(url, 'POST', {
                    inputType: inputType,
                    input: input,
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
                httpinvoke(url, 'POST', {
                    inputType: inputType,
                    input: input,
                    uploading: function(_current, _total) {
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
                var abort = httpinvoke(url, 'POST', {
                    inputType: inputType,
                    input: input,
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
            it('has "current" not greater than "total"' + postfix, function(done) {
                httpinvoke(url, 'POST', {
                    inputType: inputType,
                    input: input,
                    uploading: function(current, total) {
                        if(current > total) {
                            done(new Error('"current" was greater than "total"'));
                            done = null;
                        }
                    },
                    finished: function(err) {
                        if(err) {
                            return done(err);
                        }
                        if(done === null) {
                            return;
                        }
                        done();
                    }
                });
            });
            it('has "total" always be the same' + postfix, function(done) {
                var total = null;
                httpinvoke(url, 'POST', {
                    inputType: inputType,
                    input: input,
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
            if(typeof inputLength === 'number') {
                it('has "total" be equal to input length' + postfix, function(done) {
                    var abort = httpinvoke(url, 'POST', {
                        inputType: inputType,
                        input: input,
                        uploading: function(_, total) {
                            if(done === null) {
                                return;
                            }
                            if(inputLength !== total) {
                                done(new Error('"total"=' + total + ' was not equal to input length = ' + inputLength));
                            } else {
                                done();
                            }
                            done = null;
                            abort();
                        }
                    });
                });
            }
            it('has "current" be non-decreasing' + postfix, function(done) {
                var current = null;
                httpinvoke(url, 'POST', {
                    inputType: inputType,
                    input: input,
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
});
