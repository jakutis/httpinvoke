var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"finished" option', function() {
    this.timeout(10000);
    cfg.eachBase(function(postfix, url, crossDomain) {
        it('is called exactly once' + postfix, function(done) {
            var count = 0;
            httpinvoke(url, function(err) {
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
        it('receives status 200' + postfix, function(done) {
            httpinvoke(url, function(err, _, status, __) {
                if(err) {
                    return done(err);
                }
                done(status === 200 ? null : new Error('status is not 200'));
            });
        });
        it('receives Content-Type header' + postfix, function(done) {
            httpinvoke(url, function(err, _, __, headers) {
                if(err) {
                    return done(err);
                }
                done(typeof headers['content-type'] === 'string' ? null : new Error('Content-Type was not received'));
            });
        });
    });
});
