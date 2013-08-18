var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('Simplest GET invocation', function() {
    this.timeout(10000);
    it('does not result in an error', function(done) {
        httpinvoke(cfg.url, done);
    });
});
