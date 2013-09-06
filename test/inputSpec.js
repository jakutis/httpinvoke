var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

var makeErrorFinished = function(done) {
    return function(err, output) {
        if(err) {
            return done();
        }
        done(new Error('Did not finish with an error'));
    };
};

describe('"input" option', function() {
    cfg.eachBase(function(postfix, url) {
        it('finishes with error, if "inputType" option is not one of: "text", "auto", "json", "bytearray"' + postfix, function(done) {
            httpinvoke(url, 'POST', {
                inputType: "string",
                finished: makeErrorFinished(done)
            });
        });
        it('finishes with error, if "inputType" option is "text" and "input" option is undefined' + postfix, function(done) {
            httpinvoke(url, 'POST', {
                inputType: "text",
                finished: makeErrorFinished(done)
            });
        });
        it('finishes with error, if "inputType" option is "json" and "input" option is undefined' + postfix, function(done) {
            httpinvoke(url, 'POST', {
                inputType: "json",
                finished: makeErrorFinished(done)
            });
        });
        it('finishes with error, if "inputType" option is "auto" and "input" option is undefined' + postfix, function(done) {
            httpinvoke(url, 'POST', {
                inputType: "auto",
                finished: makeErrorFinished(done)
            });
        });
        it('finishes with error, if "inputType" option is "bytearray" and "input" option is undefined' + postfix, function(done) {
            httpinvoke(url, 'POST', {
                inputType: "bytearray",
                finished: makeErrorFinished(done)
            });
        });
        it('finishes with error, if Content-Type header is defined and "input" option is undefined' + postfix, function(done) {
            httpinvoke(url, 'POST', {
                headers: {
                    'Content-Type': 'application/json'
                },
                finished: makeErrorFinished(done)
            });
        });
        it('finishes with error, if Content-Type header is not defined, "input" option is defined and "inputType" option is "auto"' + postfix, function(done) {
            httpinvoke(url, 'POST', {
                inputType: "auto",
                input: 'foobar',
                finished: makeErrorFinished(done)
            });
        });
        it('finishes with error, if Content-Type header is not defined, "input" option is defined and "inputType" option is undefined' + postfix, function(done) {
            httpinvoke(url, 'POST', {
                input: 'foobar',
                finished: makeErrorFinished(done)
            });
        });
        it('correctly sends the input when inputType is text' + postfix, function(done) {
            httpinvoke(url + 'text/utf8', 'POST', {
                input: cfg.textTest(),
                inputType: 'text',
                outputType: 'text',
                finished: function(err, output) {
                    if(err) {
                        return done(err);
                    }
                    if(output === 'OK') {
                        return done();
                    }
                    done(new Error('Server response about the input is: ' + output));
                }
            });
        });
        it('correctly sends the input when inputType is bytearray' + postfix, function(done) {
            httpinvoke(url + 'bytearray', 'POST', {
                input: cfg.bytearrayTest(),
                inputType: 'bytearray',
                outputType: 'text',
                finished: function(err, output) {
                    if(err) {
                        return done(err);
                    }
                    if(output === 'OK') {
                        return done();
                    }
                    done(new Error('Server response about the input is: ' + output));
                }
            });
        });
        // TODO test all inputTypes (json, text, bytearray, auto) on server
        // TODO test all input types (Array, ArrayBuffer, Uint8Array, Buffer) on server
        // TODO test that server receives content-type header, when it is generated from inputType
    });
});
