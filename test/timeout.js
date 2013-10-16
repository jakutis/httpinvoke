var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('timeout functionality', function() {
    this.timeout(10000);
    cfg.eachBase(function(postfix, url) {
        describe('"timeout" option', function() {
            it('forces finish with error when normal finish would take longer than specified timeout' + postfix, function(done) {
                httpinvoke(url + 'tensecondsDownload', {
                    timeout: 200,
                    finished: function(err) {
                        if(typeof err !== 'object' || err === null || !(err instanceof Error)) {
                            return done(new Error('An error was not received'));
                        }
                        done();
                    }
                });
            });
        });
        describe('"uploadTimeout" option', function() {
            it('forces finish with error when gotStatus is not invoked in specified duration' + postfix, function(done) {
                httpinvoke(url + 'tensecondsUpload', {
                    uploadTimeout: 200,
                    finished: function(err) {
                        if(typeof err !== 'object' || err === null || !(err instanceof Error)) {
                            return done(new Error('An error was not received'));
                        }
                        done();
                    }
                });
            });
        });
        describe('"downloadTimeout" option', function() {
            it('forces finish with error when finished is not invoked in specified duration after gotStatus' + postfix, function(done) {
                httpinvoke(url + 'tensecondsDownload', {
                    downloadTimeout: 200,
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
});
