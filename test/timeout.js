var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"timeout" option', function() {
    'use strict';
    this.timeout(10000);
    cfg.eachBase(function(postfix, url) {
        it('lets finish without an error when the whole request would take shorter than specified timeout' + postfix, function(done) {
            httpinvoke(url, {
                timeout: 1000,
                finished: done
            });
        });
        it('forces finish with error when the whole request would take longer than specified timeout' + postfix, function(done) {
            httpinvoke(url + 'twosecondDownload', {
                timeout: 1000,
                finished: function(err) {
                    if(typeof err !== 'object' || err === null || !(err instanceof Error)) {
                        return done(new Error('An error was not received'));
                    }
                    done();
                }
            });
        });
        it('forces finish with error when value is less than or equal to 0' + postfix, function(done) {
            httpinvoke(url, {
                timeout: 0,
                finished: function(err) {
                    if(typeof err !== 'object' || err === null || !(err instanceof Error)) {
                        return done(new Error('An error was not received'));
                    }
                    done();
                }
            });
        });
        it('forces finish with error when value is greater than or equal to 1073741824' + postfix, function(done) {
            httpinvoke(url, {
                timeout: 1073741824,
                finished: function(err) {
                    if(typeof err !== 'object' || err === null || !(err instanceof Error)) {
                        return done(new Error('An error was not received'));
                    }
                    done();
                }
            });
        });

        it('lets finish without an error when upload would take shorter than specified timeout' + postfix, function(done) {
            httpinvoke(url, {
                timeout: [1000, 1073741823],
                finished: done
            });
        });
        it('lets finish without an error when upload would take shorter than specified upload timeout, but download would take longer than upload timeout' + postfix, function(done) {
            httpinvoke(url + 'twosecondDownload', {
                timeout: [1000, 1073741823],
                finished: done
            });
        });
        it('forces finish with "upload timeout" error when upload would take longer than specified upload timeout' + postfix, function(done) {
            httpinvoke(url + 'twosecondUpload', {
                timeout: [1000, 1073741823],
                finished: function(err) {
                    if(typeof err !== 'object' || err === null || !(err instanceof Error) || err.message !== 'upload timeout') {
                        return done(new Error('A "upload timeout" error was not received'));
                    }
                    done();
                }
            });
        });
        it('forces finish with error when upload value is less than or equal to 0' + postfix, function(done) {
            httpinvoke(url + 'twosecondUpload', {
                timeout: [0, 1073741823],
                finished: function(err) {
                    if(typeof err !== 'object' || err === null || !(err instanceof Error)) {
                        return done(new Error('An error was not received'));
                    }
                    done();
                }
            });
        });
        it('forces finish with error when upload value is greater than or equal to 1073741824' + postfix, function(done) {
            httpinvoke(url + 'twosecondUpload', {
                timeout: [1073741824, 1073741823],
                finished: function(err) {
                    if(typeof err !== 'object' || err === null || !(err instanceof Error)) {
                        return done(new Error('An error was not received'));
                    }
                    done();
                }
            });
        });

        it('lets finish without an error when download would take shorter than specified timeout' + postfix, function(done) {
            httpinvoke(url, {
                timeout: [1073741823, 1000],
                finished: done
            });
        });
        it('lets finish without an error when download would take shorter than specified download timeout, but upload would take longer than download timeout' + postfix, function(done) {
            httpinvoke(url + 'twosecondUpload', {
                timeout: [1073741823, 1000],
                finished: done
            });
        });
        it('forces finish with "download timeout" error when download would take longer than specified download timeout' + postfix, function(done) {
            httpinvoke(url + 'twosecondDownload', {
                timeout: [1073741823, 1000],
                finished: function(err) {
                    if(typeof err !== 'object' || err === null || !(err instanceof Error) || err.message !== 'download timeout') {
                        return done(new Error('A "download timeout" error was not received'));
                    }
                    done();
                }
            });
        });
        it('forces finish with error when download value is less than or equal to 0' + postfix, function(done) {
            httpinvoke(url + 'twosecondDownload', {
                timeout: [1073741823, 0],
                finished: function(err) {
                    if(typeof err !== 'object' || err === null || !(err instanceof Error)) {
                        return done(new Error('An error was not received'));
                    }
                    done();
                }
            });
        });
        it('forces finish with error when download value is greater than or equal to 1073741824' + postfix, function(done) {
            httpinvoke(url + 'twosecondDownload', {
                timeout: [1073741823, 1073741824],
                finished: function(err) {
                    if(typeof err !== 'object' || err === null || !(err instanceof Error)) {
                        return done(new Error('An error was not received'));
                    }
                    done();
                }
            });
        });
    });
});
