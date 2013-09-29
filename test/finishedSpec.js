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
        it('has headers argument defined' + postfix, function(done) {
            httpinvoke(url, function(err, _, __, headers) {
                if(err) {
                    return done(err);
                }
                if(typeof headers === 'undefined') {
                    return done(new Error('headers argument is not defined'));
                }
                done();
            });
        });
        if(!crossDomain || httpinvoke.corsStatus) {
            it('has status argument defined' + postfix, function(done) {
                httpinvoke(url, function(err, _, status, __) {
                    if(err) {
                        return done(err);
                    }
                    if(typeof status === 'undefined') {
                        return done(new Error('status argument is not defined'));
                    }
                    done();
                });
            });
        }
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
