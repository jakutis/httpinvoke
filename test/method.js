var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('supported HTTP methods', function() {
    'use strict';
    this.timeout(10000);
    cfg.eachBase(function(postfix, url, crossDomain) {
        var method = function(method) {
            if(crossDomain && method === 'DELETE' && !httpinvoke.corsDELETE) {
                return;
            }
            if(!httpinvoke.PATCH || (crossDomain && method === 'PATCH' && !httpinvoke.corsPATCH)) {
                return;
            }
            if(crossDomain && method === 'PUT' && !httpinvoke.corsPUT) {
                return;
            }
            if(crossDomain && method === 'HEAD' && !httpinvoke.corsHEAD) {
                return;
            }
            it('include the "' + method + '" method' + postfix, function(done) {
                httpinvoke(url, method, done);
            });
        };
        var nomethod = function(method) {
            it('do not include the "' + method + '" method' + postfix, function(done) {
                httpinvoke(url, method, function(err) {
                    if(err) {
                        done();
                    } else {
                        done(new Error('Error was not received'));
                    }
                });
            });
        };

        ['GET', 'HEAD', 'PATCH', 'POST', 'PUT', 'DELETE'].forEach(method);
        ['OPTIONS', 'TRACE'].forEach(httpinvoke.anyMethod ? method : nomethod);
        ['CONNECT', 'NOTREALLYAMETHODNAME'].forEach(nomethod);
    });
});
