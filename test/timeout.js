var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"timeout" option', function() {
    this.timeout(10000);
    cfg.eachBase(function(postfix, url) {
        it('forces finish with error when normal finish would take longer than specified timeout ' + postfix, function(done) {
            httpinvoke(url + 'tenseconds', {
                timeout: 3000,
                finished: function(err) {
                    if(typeof err !== 'object' || err === null || !(err instanceof Error)) {
                        return done(new Error('An error was not received'));
                    }
                    done();
                }
            });
        });
    });
});
