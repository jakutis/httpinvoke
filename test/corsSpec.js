var url = typeof window === 'undefined' ? 'http://example.org' : location.href;
var httpinvoke = require('../httpinvoke-node');

describe('Cross-Origin Resource Sharing feature flag', function() {
    this.timeout(10000);
    it('exists', function(done) {
        if(typeof httpinvoke.cors !== 'boolean') {
            return done(new Error('The httpinvoke.cors flag was not found'));
        }
        if(!httpinvoke.cors) {
            console.log('CORS is not supported');
        }
        done();
    });
    it('works as advertised', function(done) {
        if(!httpinvoke.cors) {
            return done();
        }
        httpinvoke('http://attacker-site.com/html5/CORS/show_cookies.php', done);
    });
});
