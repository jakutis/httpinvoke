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
        it('does not break when uploading callback throws an error' + postfix, function(done) {
            var runnable = this.runnable();
            runnable.state = 'failed';
            var calledOnce = false;
            httpinvoke(url, {
                uploading: function() {
                    if(calledOnce) {
                        return;
                    }
                    calledOnce = true;
                    throw new Error('fake error in uploading callback');
                },
                finished: function(err) {
                    if(!err) {
                        runnable.state = 'passed';
                    }
                    done.apply(null, arguments);
                }
            });
        });
        it('does not break when gotStatus callback throws an error' + postfix, function(done) {
            var runnable = this.runnable();
            runnable.state = 'failed';
            httpinvoke(url, {
                gotStatus: function() {
                    throw new Error('fake error in gotStatus callback');
                },
                finished: function(err) {
                    if(!err) {
                        runnable.state = 'passed';
                    }
                    done.apply(null, arguments);
                }
            });
        });
        it('does not break when downloading callback throws an error' + postfix, function(done) {
            var runnable = this.runnable();
            runnable.state = 'failed';
            var calledOnce = false;
            httpinvoke(url, {
                downloading: function() {
                    if(calledOnce) {
                        return;
                    }
                    calledOnce = true;
                    throw new Error('fake error in downloading callback');
                },
                finished: function(err) {
                    if(!err) {
                        runnable.state = 'passed';
                    }
                    done.apply(null, arguments);
                }
            });
        });
    });
});
