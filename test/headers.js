var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

// http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader()-method
var forbiddenInputHeaders = ['Accept-Charset', 'Accept-Encoding', 'Access-Control-Request-Headers', 'Access-Control-Request-Method', 'Connection', 'Content-Length', 'Content-Transfer-Encoding', 'Cookie', 'Cookie2', 'Date', 'DNT', 'Expect', 'Host', 'Keep-Alive', 'Origin', 'Referer', 'TE', 'Trailer', 'Transfer-Encoding', 'Upgrade', 'User-Agent', 'Via', 'Proxy-Authorization', 'Sec-From'];

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
    forbiddenInputHeaders.forEach(function(header) {
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
