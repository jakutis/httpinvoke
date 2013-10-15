var http = require('http');
var url = require('url');
var zlib = require('zlib');

var mixInPromise, pass, isArray, isArrayBufferView, _undefined, nextTick;

var decompress = function(output, encoding, cb) {
    if(encoding === 'gzip') {
        zlib.gunzip(output, cb);
    } else if(encoding === 'deflate') {
        zlib.inflate(output, function(err, out) {
            if(err) {
                return zlib.inflateRaw(output, cb);
            }
            cb(null, out);
        });
    } else if(encoding === 'identity') {
        process.nextTick(function() {
            cb(null, output);
        });
    } else {
        process.nextTick(function() {
            cb(new Error('unsupported encoding ' + encoding));
        });
    }
};

// http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader()-method
var forbiddenInputHeaders = ['accept-charset', 'accept-encoding', 'access-control-request-headers', 'access-control-request-method', 'connection', 'content-length', 'content-transfer-encoding', 'cookie', 'cookie2', 'date', 'dnt', 'expect', 'host', 'keep-alive', 'origin', 'referer', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'user-agent', 'via'];
var validateInputHeaders = function(headers) {
    for(var header in headers) {
        if(headers.hasOwnProperty(header)) {
            var headerl = header.toLowerCase();
            if(forbiddenInputHeaders.indexOf(headerl) >= 0) {
                throw new Error('Input header ' + header + ' is forbidden to be set programmatically');
            }
            if(headerl.substr(0, 'proxy-'.length) === 'proxy-') {
                throw new Error('Input header ' + header + ' (to be precise, all Proxy-*) is forbidden to be set programmatically');
            }
            if(headerl.substr(0, 'sec-'.length) === 'sec-') {
                throw new Error('Input header ' + header + ' (to be precise, all Sec-*) is forbidden to be set programmatically');
            }
        }
    }
};

var copy = function(from, to) {
    Object.keys(from).forEach(function(key) {
        to[key] = from[key];
    });
    return to;
};

var httpinvoke = function(uri, method, options, cb) {
    var promise, failWithoutRequest, uploadProgressCb, downloadProgressCb, inputLength, timeout, inputHeaders, statusCb, outputHeaders, exposedHeaders, status, outputBinary, input, outputLength, outputConverter;
    /*************** initialize helper variables **************/
    try {
        validateInputHeaders(inputHeaders);
    } catch(err) {
        return failWithoutRequest(cb, err);
    }
    inputHeaders = copy(inputHeaders, {});
    inputHeaders['Accept-Encoding'] = 'gzip, deflate, identity';

    var ignorantlyConsume = function(res) {
        res.on('data', pass);
        res.on('end', pass);
    };
    uri = url.parse(uri);
    if(timeout > 0) {
        setTimeout(function() {
            cb(new Error('download timeout'));
        }, timeout);
    }
    var req = http.request({
        hostname: uri.hostname,
        port: Number(uri.port),
        path: uri.path,
        method: method,
        headers: inputHeaders
    }, function(res) {
        var contentEncoding;
        if(!cb) {
            return ignorantlyConsume(res);
        }

        outputHeaders = res.headers;
        if('content-encoding' in outputHeaders) {
            contentEncoding = outputHeaders['content-encoding'];
            delete outputHeaders['content-encoding'];
        } else {
            contentEncoding = 'identity';
        }

        status = res.statusCode;

        uploadProgressCb(inputLength, inputLength);
        if(!cb) {
            return ignorantlyConsume(res);
        }

        statusCb(status, outputHeaders);
        if(!cb) {
            return ignorantlyConsume(res);
        }

        if('content-length' in outputHeaders) {
            outputLength = Number(outputHeaders['content-length']);
        }

        downloadProgressCb(0, outputLength);
        if(!cb) {
            return ignorantlyConsume(res);
        }
        if(method === 'HEAD') {
            ignorantlyConsume(res);
            downloadProgressCb(0, 0);
            return cb && cb(null, _undefined, status, outputHeaders);
        }

        var output = [], downloaded = 0;
        res.on('data', function(chunk) {
            if(!cb) {
                return;
            }
            downloaded += chunk.length;
            output.push(chunk);
            downloadProgressCb(downloaded, outputLength);
        });
        res.on('end', function() {
            if(!cb) {
                return;
            }

            if(typeof outputLength === 'undefined') {
                outputLength = downloaded;
            }

            if(downloaded !== outputLength) {
                return cb(new Error('network error'));
            }

            downloadProgressCb(outputLength, outputLength);
            if(!cb) {
                return;
            }

            if(outputLength === 0 && typeof outputHeaders['content-type'] === 'undefined') {
                return cb(null, _undefined, status, outputHeaders);
            }

            decompress(Buffer.concat(output, downloaded), contentEncoding, function(err, output) {
                if(!cb) {
                    return;
                }
                if(err) {
                    return cb(new Error('network error'));
                }
                if(!outputBinary) {
                    output = output.toString('utf8');
                }
                try {
                    cb(null, outputConverter(output), status, outputHeaders);
                } catch(err) {
                    cb(err);
                }
            });
        });
    });

    nextTick(function() {
        cb && uploadProgressCb(0, inputLength);
    });
    if(typeof input !== 'undefined') {
        input = new Buffer(input);
        inputLength = input.length;
        req.write(input);
    }
    req.on('error', function(e) {
        cb && cb(new Error('network error'));
    });
    req.end();
    promise = function() {
        cb && cb(new Error('abort'));
    };
    return mixInPromise(promise);
};
httpinvoke.corsResponseContentTypeOnly = false;
httpinvoke.corsRequestHeaders = true;
httpinvoke.corsCredentials = true;
httpinvoke.cors = true;
httpinvoke.corsDELETE = true;
httpinvoke.corsHEAD = true;
httpinvoke.corsPATCH = true;
httpinvoke.corsPUT = true;
httpinvoke.corsStatus = true;
httpinvoke.corsResponseTextOnly = false;
httpinvoke.requestTextOnly = false;
httpinvoke.PATCH = true;

module.exports = httpinvoke;
