var url = typeof window === 'undefined' ? 'http://example.org' : location.href;
var httpinvoke = require('../httpinvoke-node');

describe('Simplest GET invocation', function() {
    this.timeout(10000);
    it('does not result in an error', function(done) {
        httpinvoke(url, {
            finished: done
        });
    });
});
