var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

var makeTextFinished = function(done) {
    return function(err, output) {
        if(err) {
            return done(err);
        }
        if(typeof output !== 'string') {
            return done(new Error('Received output is not a string'));
        }
        if(output !== cfg.textTest()) {
            return done(new Error('Received output ' + output + ' is not equal to expected output ' + cfg.textTest()));
        }
        done();
    };
};

var makeByteArrayFinished = function(done) {
    return function(err, output) {
        if(err) {
            return done(err);
        }
        var expected = cfg.bytearrayTest();
        if(typeof output !== 'object' || output === null) {
            return done(new Error('Received output is not a non-null object'));
        }
        if(output.length !== expected.length) {
            return done(new Error('Received output length ' + output.length + ' is not equal to expected output length ' + expected.length));
        }
        var failures = [];
        for(var i = 0; i < output.length; i += 1) {
            if(output[i] !== expected[i]) {
                failures.push(i + 'th byte: ' + output[i] + ' !== ' + expected[i]);
            }
        }
        if(failures.length > 0) {
            return done(new Error('Some received bytes differ from expected: ' + failures.join(',')));
        }
        done();
    };
};

describe('"output" argument of "finished" option', function() {
    this.timeout(10000);
    cfg.eachBase(function(postfix, url, crossDomain) {
        it('finishes with error, if "outputType" option is not one of: "text", "bytearray"' + postfix, function(done) {
            httpinvoke(url, {
                outputType: "string",
                finished: function(err, output) {
                    if(err) {
                        return done();
                    }
                    done(new Error('Did not finish with an error'));
                }
            });
        });
        // TODO test various encodings
        it('matches an expected string when outputType is text' + postfix, function(done) {
            httpinvoke(url + 'text/utf8', {
                outputType: 'text',
                finished: makeTextFinished(done)
            });
        });
        if(!crossDomain || !httpinvoke.corsResponseTextOnly) {
            it('matches an expected bytearray when outputType is bytearray' + postfix, function(done) {
                httpinvoke(url + 'bytearray', {
                    outputType: 'bytearray',
                    finished: makeByteArrayFinished(done)
                });
            });
        }
        it('matches an expected string when outputType is not defined and Content-Type is text/*' + postfix, function(done) {
            httpinvoke(url + 'text/utf8', makeTextFinished(done));
        });
        if(typeof Buffer !== 'undefined') {
            it('is a Buffer when runtime supports Buffer and outputType is bytearray' + postfix, function(done) {
                httpinvoke(url + 'bytearray', {
                    outputType: 'bytearray',
                    finished: function(err, output) {
                        if(err) {
                            return done(err);
                        }
                        if(!(output instanceof Buffer)) {
                            return done(new Error('Received output is not a Buffer'));
                        }
                        done();
                    }
                });
            });
        } else if(typeof Uint8Array !== 'undefined') {
            it('is an Uint8Array when runtime supports Uint8Array and does not support Buffer and outputType is bytearray' + postfix, function(done) {
                httpinvoke(url + 'bytearray', {
                    outputType: 'bytearray',
                    finished: function(err, output) {
                        if(err) {
                            return done(err);
                        }
                        if(!(output instanceof Uint8Array)) {
                            return done(new Error('Received output is not an Uint8Array'));
                        }
                        done();
                    }
                });
            });
        } else {
            if(!crossDomain || !httpinvoke.corsResponseTextOnly) {
                it('is an Array when runtime does not support neither Uint8Array, nor Buffer and outputType is bytearray' + postfix, function(done) {
                    httpinvoke(url + 'bytearray', {
                        outputType: 'bytearray',
                        finished: function(err, output) {
                            if(err) {
                                return done(err);
                            }
                            if(Object.prototype.toString.call(output) !== '[object Array]') {
                                return done(new Error('Received output is not an Array'));
                            }
                            done();
                        }
                    });
                });
            }
        }
        if(!crossDomain || httpinvoke.corsHEAD) {
            it('is undefined when method is HEAD' + postfix, function(done) {
                httpinvoke(url, 'HEAD', {
                    finished: function(err, output) {
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
        }
        it('is undefined when response does not include an entity' + postfix, function(done) {
            httpinvoke(url + 'noentity', 'POST', function(err, output) {
                if(err) {
                    return done(err);
                }
                if(typeof output !== 'undefined') {
                    return done(new Error('Output is not undefined'));
                }
                done();
            });
        });
        it('is undefined when response is empty bytearray' + postfix, function(done) {
            httpinvoke(url + 'bytearray/empty', {
                outputType: 'bytearray',
                finished: function(err, output) {
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
        it('is undefined when response is empty string' + postfix, function(done) {
            httpinvoke(url + 'text/utf8/empty', {
                outputType: 'text',
                finished: function(err, output) {
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
    });
});
