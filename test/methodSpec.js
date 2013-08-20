var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('supported HTTP methods', function() {
    this.timeout(10000);
    var method = function(method) {
        it('include the "' + method + '" method', function(done) {
            httpinvoke(cfg.url, method, done);
        });
    };
    var methods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'];
    for(var i = 0; i < methods.length; i += 1) {
        method(methods[i]);
    }
});
