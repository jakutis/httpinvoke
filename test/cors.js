var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"cors" feature flag', function() {
    'use strict';
    this.timeout(10000);
    it('exists', function(done) {
        if(typeof httpinvoke.cors !== 'boolean') {
            return done(new Error('The httpinvoke.cors flag was not found'));
        }
        done();
    });
    it('ensures, when being false and making cross-origin request, that no callbacks are called, except "finished" with Error', function(done) {
        if(httpinvoke.cors) {
            return done();
        }
        var callback = function() {
            if(done === null) {
                return;
            }
            done(new Error('A callback was called'));
            done = null;
        };
        httpinvoke(cfg.corsURL, {
            uploading: callback,
            gotStatus: callback,
            downloading: callback,
            finished: function(err) {
                if(done === null) {
                    return;
                }
                if(typeof err === 'object' && err !== null && err instanceof Error) {
                    done();
                } else {
                    done(new Error('"finished" was called without error'));
                }
            }
        });
    });
});
