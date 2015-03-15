var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"headers" option', function() {
    'use strict';
    this.timeout(10000);
    cfg.eachBase(function(postfix, url, crossDomain) {
        if(!crossDomain || httpinvoke.corsRequestHeaders) {
            it('has Content-Type respected' + postfix, function(done) {
                var contentType = 'text/x-c; charset=UTF-8';
                httpinvoke(url + 'headers/contentType', 'POST', {
                    headers: {
                        'Content-Type': contentType
                    },
                    input: 'int main() {\n  return 0;\n}\n',
                    outputType: 'text',
                    finished: function(err, output) {
                        if(err) {
                            return done(err);
                        }
                        if(output !== contentType) {
                            return done(new Error('expected ' + contentType + ', but had ' + output));
                        }
                        done();
                    }
                });
            });
        }
    });
    httpinvoke.forbiddenInputHeaders.forEach(function(header) {
        it('immediately finishes with error, when a "' + header + '" header is tried to be set', function(done) {
            var headers = {};
            headers[header] = '';
            httpinvoke(cfg.url, {
                headers: headers,
                finished: function(err) {
                    if(err) {
                        return done();
                    }
                    done(err);
                }
            });
        });
    });
});
