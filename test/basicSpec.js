var httpinvoke = require('../httpinvoke-generated-commonjs.js');
describe('simple usage', function() {
    it('not result in an error', function() {
        var done = false;
        var err;
        runs(function() {
            httpinvoke('http://updates.html5rocks.com', {
                finished: function(_err, result) {
                    err = _err;
                    done = true;
                }
            });
        }, 'finished callback should be called');
        waitsFor(function() {
            return done;
        });
        runs(function() {
            expect(err).toBe(null);
        });
    });
});
