var httpinvoke = require('../httpinvoke-node');

describe('"corsCredentials" feature flag', function() {
    'use strict';
    this.timeout(10000);
    it('exists', function(done) {
        if(typeof httpinvoke.corsCredentials !== 'boolean') {
            return done(new Error('The httpinvoke.corsCredentials flag was not found'));
        }
        done();
    });
});

