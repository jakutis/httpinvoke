var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"finished" option', function() {
    this.timeout(10000);
    it('is called exactly once', function(done) {
        var count = 0;
        httpinvoke(cfg.url, {
            finished: function() {
                count += 1;
                if(count === 1) {
                    setTimeout(function() {
                        if(count > 1) {
                            return done(new Error('"finished" was called ' + count + ' times'));
                        }
                        done();
                    }, 3000);
                }
            }
        });
    });
    // TODO do this test for various binary and variously encoded text responses
    it('has "output" be an ascii encoded string, when response Content-Type is "text/plain; charset=UTF-8"', function(done) {
        var expectedOutput = unescape(encodeURIComponent('Sveika Žeme\n'));
        httpinvoke(cfg.url + 'utf8', {
            finished: function(err, output) {
                if(err) {
                    return done(err);
                }
                if(output !== expectedOutput) {
                    return done(new Error('Received output "' + output + '" is not equal to the expected output "' + expectedOutput + '"'));
                }
                done();
            }
        });
    });
});
