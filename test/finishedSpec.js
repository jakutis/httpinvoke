var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"finished" option', function() {
    this.timeout(10000);
    it('is called exactly once', function(done) {
        var count = 0;
        httpinvoke(cfg.url, function(err) {
            if(err) {
                done(err);
                done = null;
                return;
            }
            count += 1;
            if(count === 1) {
                setTimeout(function() {
                    if(done === null) {
                        return;
                    }
                    if(count > 1) {
                        return done(new Error('"finished" was called ' + count + ' times'));
                    }
                    done();
                }, 3000);
            }
        });
    });
});
