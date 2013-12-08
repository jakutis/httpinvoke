var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"gotStatus" option', function() {
    'use strict';
    this.timeout(10000);
    cfg.eachBase(function(postfix, url, crossDomain) {
        it('receives Content-Type header when method=GET results in status 200 on server' + postfix, function(done) {
            httpinvoke(url, {
                gotStatus: function(_, headers) {
                    done(typeof headers['content-type'] === 'string' ? null : new Error('Content-Type was not received'));
                }
            });
        });
        if(!crossDomain || httpinvoke.corsStatus) {
            it('receives status 200 when method=GET results in status 200 on server' + postfix, function(done) {
                httpinvoke(url, {
                    gotStatus: function(status) {
                        if(status !== 200) {
                            return done(new Error('status argument is not defined'));
                        }
                        done();
                    }
                });
            });
        }
        it('is called exactly once' + postfix, function(done) {
            var count = 0;
            httpinvoke(url, {
                gotStatus: function() {
                    count += 1;
                },
                finished: function(err) {
                    if(err) {
                        return done(err);
                    }
                    if(count !== 1) {
                        return done(new Error('It was called ' + count + ' times'));
                    }
                    done();
                }
            });
        });
    });
});
