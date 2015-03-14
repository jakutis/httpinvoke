var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('anonymous', function() {
    'use strict';
    this.timeout(10000);
    var makeAnonymousTest = function(url, options, anonymous) {
        var expected = anonymous ? 'cookies=no' : 'cookies=yes';
        return function(done) {
            cfg.setCookie('httpinvokeAnonymousTest=5; path=/');
            options.corsCredentials = true;
            httpinvoke(url + 'credentials', options, function(err, actual) {
                if(err) {
                    return done(err);
                }
                done(expected === actual ? null : new Error('Server said "' + actual + '", but "' + expected + '" was expected'));
            });
        };
    };
    describe('"anonymousByDefault" feature flag', function() {
        it('exists', function(done) {
            if(typeof httpinvoke.anonymousByDefault !== 'boolean') {
                return done(new Error('The httpinvoke.anonymousByDefault flag was not found'));
            }
            done();
        });
        cfg.eachBase(function(postfix, url, cors) {
            if(httpinvoke.anonymousByDefault) {
                it('ensures, when being true, that credentials are not sent' + postfix, makeAnonymousTest(url, {}, true));
            } else if(!cors || httpinvoke.corsCredentials) {
                it('ensures, when being false, that credentials are sent' + postfix, makeAnonymousTest(url, {}, false));
            }
        });
    });
    describe('"anonymousOption" feature flag', function() {
        it('exists', function(done) {
            if(typeof httpinvoke.anonymousOption !== 'boolean') {
                return done(new Error('The httpinvoke.anonymousOption feature flag was not found'));
            }
            done();
        });
    });
    if(httpinvoke.anonymousOption) {
        describe('"anonymous" option', function() {
            cfg.eachBase(function(postfix, url) {
                it('ensures, when being true, that credentials are not sent' + postfix, makeAnonymousTest(url, {anonymous: true}, true));
                it('ensures, when being false, that credentials are sent' + postfix, makeAnonymousTest(url, {anonymous: false}, false));
            });
        });
    }
});
