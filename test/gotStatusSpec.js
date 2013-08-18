var url = typeof window === 'undefined' ? 'http://example.org' : location.href;
var httpinvoke = require('../httpinvoke-node');

describe('"gotStatus" option', function() {
    this.timeout(10000);
    it('receives Content-Type header', function(done) {
        httpinvoke(url, {
            gotStatus: function(_, headers) {
                done(typeof headers['content-type'] === 'string' ? null : new Error('Content-Type was not received'));
            }
        });
    });
    it('is called exactly once', function(done) {
        var count = 0;
        httpinvoke(url, {
            gotStatus: function() {
                count += 1;
            },
            finished: function() {
                if(count !== 1) {
                    return done(new Error('It was called ' + count + ' times'));
                }
                done();
            }
        });
    });
});
