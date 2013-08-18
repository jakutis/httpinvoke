var url = typeof window === 'undefined' ? 'http://example.org' : location.href;
var httpinvoke = require('../httpinvoke-node');

describe('"finished" option', function() {
    this.timeout(10000);
    it('is called exactly once', function(done) {
        var count = 0;
        httpinvoke(url, {
            finished: function() {
                count += 1;
                if(count === 1) {
                    setTimeout(function() {
                        if(count > 1) {
                            return done(new Error('"finished" was called ' + count + ' times'));
                        }
                        done();
                    }, 3000);
                }
            }
        });
    });
});
