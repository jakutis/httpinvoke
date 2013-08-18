var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('abort', function() {
    this.timeout(10000);
    it('does not throw', function(done) {
        var abort = httpinvoke(cfg.url);
        try {
            abort();
            done();
        } catch(err) {
            done(err);
        }
    });
    it('ensures that no callbacks, except finished with Error, are called when invoked immediately', function(done) {
        var callback = function() {
            if(done === null) {
                return;
            }
            done(new Error('A callback has been called'));
            done = null;
        };
        var abort = httpinvoke(cfg.url, {
            gotStatus: callback,
            downloading: callback,
            uploading: callback,
            finished: function(err) {
                if(done === null) {
                    return;
                }
                if(typeof err === 'object' && err !== null && err instanceof Error) {
                    done();
                } else {
                    done(new Error('"finished" was not called with Error'));
                }
            }
        });
        abort();
    });
});
