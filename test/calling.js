var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('calling', function() {
    'use strict';
    this.timeout(10000);
    if(httpinvoke.relativeURLs) {
        it('does not throw if relativeURLs flag is true and url is relative', function(done) {
            httpinvoke('./', done);
        });
        it('does not throw if relativeURLs flag is true and url is protocol-relative', function(done) {
            httpinvoke(cfg.sameOriginUrl.substr(cfg.sameOriginUrl.indexOf(':') + 1), done);
        });
    } else {
        it('throws error #26 if relativeURLs flag is false and url is relative', function(done) {
            httpinvoke('./foo', function(err) {
                done(err && err.message === 'Error code #26,./foo. See https://github.com/jakutis/httpinvoke#error-codes' ? null : new Error('expected error #26'));
            });
        });
        it('throws error #26 if relativeURLs flag is false and url is protocol-relative', function(done) {
            httpinvoke('//example.org/foo', function(err) {
                done(err && err.message === 'Error code #26,//example.org/foo. See https://github.com/jakutis/httpinvoke#error-codes' ? null : new Error('expected error #26'));
            });
        });
    }
    if(httpinvoke.protocols.length > 0) {
        it('throws error #25 if given absolute URL protocol is not among these: ' + httpinvoke.protocols, function(done) {
            httpinvoke('ftp://example.org', function(err) {
                done(err && err.message === 'Error code #25,ftp,' + httpinvoke.protocols.join(', ') + '. See https://github.com/jakutis/httpinvoke#error-codes' ? null : new Error('expected error #25'));
            });
        });
    }
    cfg.eachBase(function(postfix, url) {
        it('accepts url, method, options and cb' + postfix, function(done) {
            httpinvoke(url, 'GET', {}, done);
        });
        it('allows to skip method' + postfix, function(done) {
            httpinvoke(url, {}, done);
        });
        it('allows to skip options' + postfix, function(done) {
            httpinvoke(url, 'GET', done);
        });
        it('allows to skip cb' + postfix, function(done) {
            httpinvoke(url, 'GET', {
                finished: done
            });
        });
        it('allows to skip method and options' + postfix, function(done) {
            httpinvoke(url, done);
        });
        it('allows to skip method and cb' + postfix, function(done) {
            httpinvoke(url, {
                finished: done
            });
        });
        it('allows to skip options and cb' + postfix, function(done) {
            httpinvoke(url, 'GET');
            done();
        });
        it('allows to skip method, options and cb' + postfix, function(done) {
            httpinvoke(url);
            done();
        });
        it('exits with the same error that uploading callback throws' + postfix, function(done) {
            var error = new Error('fake error in uploading callback');
            httpinvoke(url, {
                uploading: function() {
                    throw error;
                },
                finished: function(err) {
                    if(!err) {
                        return done(new Error('error was not thrown'));
                    }

                    if(error === err) {
                        done();
                    } else {
                        done(err);
                    }
                }
            });
        });
        it('exits with the same error that gotStatus callback throws' + postfix, function(done) {
            var error = new Error('fake error in gotStatus callback');
            httpinvoke(url, {
                gotStatus: function() {
                    throw error;
                },
                finished: function(err) {
                    if(!err) {
                        return done(new Error('error was not thrown'));
                    }

                    if(error === err) {
                        done();
                    } else {
                        done(err);
                    }
                }
            });
        });
        it('exits with the same error that downloading callback throws' + postfix, function(done) {
            var error = new Error('fake error in gotStatus callback');
            httpinvoke(url, {
                downloading: function() {
                    throw error;
                },
                finished: function(err) {
                    if(!err) {
                        return done(new Error('error was not thrown'));
                    }

                    if(error === err) {
                        done();
                    } else {
                        done(err);
                    }
                }
            });
        });
    });
});
