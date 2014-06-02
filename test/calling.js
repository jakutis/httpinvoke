var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('calling', function() {
    'use strict';
    this.timeout(10000);
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
