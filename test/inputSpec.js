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
    it('finishes with error, if "inputType" option is not one of: "text", "auto", "json", "bytearray"', function(done) {
        httpinvoke(cfg.url, 'POST', {
            inputType: "string",
            finished: makeErrorFinished(done)
        });
    });
    it('finishes with error, if "inputType" option is "text" and "input" option is undefined', function(done) {
        httpinvoke(cfg.url, 'POST', {
            inputType: "text",
            finished: makeErrorFinished(done)
        });
    });
    it('finishes with error, if "inputType" option is "json" and "input" option is undefined', function(done) {
        httpinvoke(cfg.url, 'POST', {
            inputType: "json",
            finished: makeErrorFinished(done)
        });
    });
    it('finishes with error, if "inputType" option is "auto" and "input" option is undefined', function(done) {
        httpinvoke(cfg.url, 'POST', {
            inputType: "auto",
            finished: makeErrorFinished(done)
        });
    });
    it('finishes with error, if "inputType" option is "bytearray" and "input" option is undefined', function(done) {
        httpinvoke(cfg.url, 'POST', {
            inputType: "bytearray",
            finished: makeErrorFinished(done)
        });
    });
    it('finishes with error, if Content-Type header is defined and "input" option is undefined', function(done) {
        httpinvoke(cfg.url, 'POST', {
            headers: {
                'Content-Type': 'application/json'
            },
            finished: makeErrorFinished(done)
        });
    });
    it('finishes with error, if Content-Type header is not defined, "input" option is defined and "inputType" option is "auto"', function(done) {
        httpinvoke(cfg.url, 'POST', {
            inputType: "auto",
            input: 'foobar',
            finished: makeErrorFinished(done)
        });
    });
    it('finishes with error, if Content-Type header is not defined, "input" option is defined and "inputType" option is undefined', function(done) {
        httpinvoke(cfg.url, 'POST', {
            input: 'foobar',
            finished: makeErrorFinished(done)
        });
    });
    // TODO test all inputTypes on server
});
