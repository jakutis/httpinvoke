var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('supported HTTP methods', function() {
    this.timeout(10000);
    var i;

    var method = function(method) {
        it('include the "' + method + '" method', function(done) {
            httpinvoke(cfg.url, method, done);
        });
    };
    var methods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'];
    for(i = 0; i < methods.length; i += 1) {
        method(methods[i]);
    }

    var nomethod = function(method) {
        it('do not include the "' + method + '" method', function(done) {
            httpinvoke(cfg.url, method, function(err) {
                if(err) {
                    done();
                } else {
                    done(new Error('Error was not received'));
                }
            });
        });
    };
    var nomethods = ['OPTIONS', 'TRACE', 'CONNECT', 'NOTREALLYAMETHODNAME'];
    for(i = 0; i < nomethods.length; i += 1) {
        nomethod(nomethods[i]);
    }
});
