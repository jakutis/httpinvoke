var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"corsCredentials" feature flag', function() {
    this.timeout(10000);
    it('exists', function(done) {
        if(typeof httpinvoke.corsCredentials !== 'boolean') {
            return done(new Error('The httpinvoke.corsCredentials flag was not found'));
        }
        if(!httpinvoke.corsCredentials) {
            console.log('CORS credentials sending is not supported');
        }
        done();
    });
});

