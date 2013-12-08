var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('sequence of callback options', function() {
    'use strict';
    this.timeout(10000);
    cfg.eachBase(function(postfix, url) {
        it('ensures that "uploading" is called before "gotStatus"' + postfix, function(done) {
            var uploading = false;
            httpinvoke(url, {
                uploading: function() {
                    uploading = true;
                },
                gotStatus: function() {
                    if(done === null) {
                        return;
                    }
                    if(uploading) {
                        done();
                    } else {
                        done(new Error('"gotStatus" was called before "uploading"'));
                    }
                    done = null;
                }
            });
        });
        it('ensures that "gotStatus" is called before "downloading"' + postfix, function(done) {
            var gotStatus = false;
            httpinvoke(url, {
                gotStatus: function() {
                    gotStatus = true;
                },
                downloading: function() {
                    if(done === null) {
                        return;
                    }
                    if(gotStatus) {
                        done();
                    } else {
                        done(new Error('"downloading" was called before "gotStatus"'));
                    }
                    done = null;
                }
            });
        });
        it('ensures that "downloading" is called before "finished"' + postfix, function(done) {
            var downloading = false;
            httpinvoke(url, {
                downloading: function() {
                    downloading = true;
                },
                finished: function(err) {
                    if(done === null) {
                        return;
                    }
                    if(err) {
                        return done(err);
                    }
                    if(downloading) {
                        done();
                    } else {
                        done(new Error('"finished" was called before "downloading"'));
                    }
                    done = null;
                }
            });
        });
    });
});
