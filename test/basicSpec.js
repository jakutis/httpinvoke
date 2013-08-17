var url = typeof window === 'undefined' ? 'http://example.org' : location.href;
var httpinvoke = require('../httpinvoke-node');

describe('Simplest GET invocation', function() {
    this.timeout(10000);
    it('does not result in an error', function(done) {
        httpinvoke(url, {
            finished: done
        });
    });
    it('receives Content-Type header', function(done) {
        httpinvoke(url, {
            gotStatus: function(_, headers) {
                done(typeof headers['content-type'] === 'string' ? null : new Error('Content-Type is not received'));
            }
        });
    });
});
