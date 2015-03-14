var httpinvoke = require('../httpinvoke-node');

describe('system', function() {
    'use strict';
    this.timeout(10000);
    describe('"systemByDefault" feature flag', function() {
        it('exists', function(done) {
            if(typeof httpinvoke.systemByDefault !== 'boolean') {
                return done(new Error('The httpinvoke.systemByDefault feature flag was not found'));
            }
            done();
        });
    });
    describe('"systemOption" feature flag', function() {
        it('exists', function(done) {
            if(typeof httpinvoke.systemOption !== 'boolean') {
                return done(new Error('The httpinvoke.systemOption feature flag was not found'));
            }
            done();
        });
    });
});
