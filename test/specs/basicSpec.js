var httpinvoke = require('../../httpinvoke-node');
var config = require('../config');
describe('Simplest GET invocation', function() {
    it('does not result in an error', function(done) {
        httpinvoke(config.url, {
            finished: function(err) {
                expect(err).toBe(null);
                done();
            }
        });
    });
    it('receives Content-Type header', function(done) {
        httpinvoke(config.url, {
            gotStatus: function(_, headers) {
                expect(typeof headers['content-type']).toBe('string');
                done();
            }
        });
    });
});
