var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"finished" option', function() {
    'use strict';
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
                    global.setTimeout(function() {
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
        it('receives Content-Type header when method=GET results in status 200 on server' + postfix, function(done) {
            httpinvoke(url, {
                /* jshint unused:false */
                finished: function(err, _, __, headers) {
                /* jshint unused:true */
                    if(err) {
                        return done(err);
                    }
                    done(typeof headers['content-type'] === 'string' ? null : new Error('Content-Type was not received'));
                }
            });
        });
        if(!crossDomain || httpinvoke.corsStatus) {
            it('receives status 200 when method=GET results in status 200 on server' + postfix, function(done) {
                httpinvoke(url, {
                    finished: function(err, _, status) {
                        if(err) {
                            return done(err);
                        }
                        if(status !== 200) {
                            return done(new Error('status argument is not defined'));
                        }
                        done();
                    }
                });
            });
        }
    });
});
