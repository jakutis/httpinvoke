var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('promise', function() {
    this.timeout(10000);
    cfg.eachBase(function(postfix, url) {
        it('supports Promises/A' + postfix, function(done) {
            var promise = httpinvoke(url).then(function(response) {
                if(!done) {
                    return;
                }
                if(isValidResponse(response)) {
                    done();
                } else {
                    done(new Error('invalid response'));
                }
            }, function(error) {
                if(!done) {
                    return;
                }
                done(error);
            }, function(progress) {
                if(!done) {
                    return;
                }
                if(!isValidProgress(progress)) {
                    done(new Error('invalid progress'));
                    done = null;
                }
            });
            if(typeof promise.then !== 'function') {
                done(new Error('then() did not return a promise'));
                done = null;
            }
        });
    });
});

function isValidResponse(response) {
    return typeof response === 'object' && typeof response.body === 'string' && typeof response.statusCode === 'number' && typeof response.headers === 'object';
}

function isValidProgress(progress) {
    if(typeof progress !== 'object' || typeof progress.type !== 'string') {
        return false;
    }
    if(progress.type === 'upload') {
        if(typeof progress.current !== 'number') {
            return false;
        }
        if(typeof progress.total !== 'number') {
            return false;
        }
        if(progress.current > progress.total) {
            return false;
        }
    } else if(progress.type === 'download') {
        if(typeof progress.current !== 'number') {
            return false;
        }
        if(typeof progress.total === 'number') {
            if(progress.current > progress.total) {
                return false;
            }
        }
    } else if(progress.type === 'headers') {
        if(typeof progress.statusCode !== 'number') {
            return false;
        }
        if(typeof progress.headers !== 'object') {
            return false;
        }
        if(typeof progress.headers['content-type'] !== 'string') {
            return false;
        }
    } else if(progress.type === 'body') {
        if(typeof progress.statusCode !== 'number') {
            return false;
        }
        if(typeof progress.headers !== 'object') {
            return false;
        }
        if(typeof progress.headers['content-type'] !== 'string') {
            return false;
        }
        if(typeof progress.body !== 'string') {
            return false;
        }
    } else {
        return false;
    }
    return true;
}
