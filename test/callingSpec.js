var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('calling', function() {
    this.timeout(10000);
    it('basically works', function(done) {
        httpinvoke(cfg.url, 'GET', {
            finished: done
        });
    });
    it('allows to skip method', function(done) {
        httpinvoke(cfg.url, {
            finished: done
        });
    });
    it('allows to specify just "finished" callback instead of "options" object', function(done) {
        httpinvoke(cfg.url, done);
    });
});
