var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('calling', function() {
    this.timeout(10000);
    cfg.eachBase(function(postfix, url) {
        it('basically works' + postfix, function(done) {
            httpinvoke(url, 'GET', {
                finished: done
            });
        });
        it('allows to skip method' + postfix, function(done) {
            httpinvoke(url, {
                finished: done
            });
        });
        it('allows to specify just "finished" callback instead of "options" object' + postfix, function(done) {
            httpinvoke(url, done);
        });
        it('does not break when callbacks throw errors' + postfix, function(done) {
            httpinvoke(url, {
                uploading: function() {
                    throw new Error('foobar');
                },
                gotStatus: function() {
                    throw new Error('foobar');
                },
                downloading: function() {
                    throw new Error('foobar');
                },
                finished: done
            });
        });
        // TODO add headersSpec and test correct request and response Content-Type header sending
    });
    it('immediately errors-out when url is not reachable', function(done) {
        httpinvoke('http://non-existant.url/foobar', 'GET', function(err) {
            if(typeof err !== 'object' || err === null || !(err instanceof Error)) {
                return done(new Error('error was not received'));
            }
            done();
        });
    });
});
