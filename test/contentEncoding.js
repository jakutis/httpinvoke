var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('support for "Content-Encoding" from server-side', function() {
    'use strict';
    this.timeout(10000);
    cfg.eachBase(function(postfix, url) {
        ['gzip', 'deflate', 'identity'].forEach(function(encoding) {
            it('includes ' + encoding + postfix, function(done) {
                httpinvoke(url + 'contentEncoding/' + encoding, function(err, output) {
                    if(err) {
                        return done(err);
                    }
                    if(output !== 'Hello World\n') {
                        return done(new Error('Content-Encoding ' + encoding + ' had an incorrect output ' + output));
                    }
                    done();
                });
            });
        });
    });
});
