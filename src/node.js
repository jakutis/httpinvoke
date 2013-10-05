var http = require('http');
var url = require('url');

var pass, isArray, isArrayBufferView, _undefined, nextTick;

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

var httpinvoke = function(uri, method, options, cb) {
    var mixInPromise, promise, failWithoutRequest, uploadProgressCb, inputLength, noData, timeout, inputHeaders, corsOriginHeader, statusCb, initDownload, updateDownload, outputHeaders, exposedHeaders, status, outputBinary, input, outputLength, outputConverter;
    /*************** initialize helper variables **************/
    try {
        validateInputHeaders(inputHeaders);
    } catch(err) {
        return failWithoutRequest(cb, err);
    }
    var ignorantlyConsume = function(res) {
        res.on('data', pass);
        res.on('end', pass);
    };
    uri = url.parse(uri);
    if(timeout > 0) {
        setTimeout(function() {
            cb(new Error('Timeout of ' + timeout + 'ms exceeded'));
            cb = null;
        }, timeout);
    }
    var req = http.request({
        hostname: uri.hostname,
        port: Number(uri.port),
        path: uri.path,
        method: method,
        headers: inputHeaders
    }, function(res) {
        if(cb === null) {
            ignorantlyConsume(res);
            return;
        }
        outputHeaders = res.headers;
        status = res.statusCode;

        uploadProgressCb(inputLength, inputLength);
        if(cb === null) {
            ignorantlyConsume(res);
            return;
        }

        statusCb(status, outputHeaders);
        if(cb === null) {
            ignorantlyConsume(res);
            return;
        }

        updateDownload(0);
        if(cb === null) {
            ignorantlyConsume(res);
            return;
        }
        if(typeof outputHeaders['content-length'] !== 'undefined') {
            initDownload(Number(outputHeaders['content-length']));
            if(cb === null) {
                ignorantlyConsume(res);
                return;
            }
        }
        if(method === 'HEAD' || typeof outputHeaders['content-type'] === 'undefined') {
            ignorantlyConsume(res);
            return noData();
        }

        var output = [], downloaded = 0;
        res.on('data', function(chunk) {
            if(cb === null) {
                return;
            }
            downloaded += chunk.length;
            output.push(chunk);
            updateDownload(downloaded);
            if(cb === null) {
                return;
            }
        });
        res.on('end', function() {
            if(cb === null) {
                return;
            }
            updateDownload(downloaded);
            if(cb === null) {
                return;
            }

            if(typeof outputLength === 'undefined') {
                outputLength = downloaded;
            }

            output = Buffer.concat(output, downloaded);
            if(!outputBinary) {
                output = output.toString('utf8');
            }
            try {
                cb(null, outputConverter(output), status, outputHeaders);
            } catch(err) {
                cb(err);
            }
            cb = null;
        });
    });

    nextTick(function() {
        if(cb === null) {
            return;
        }
        uploadProgressCb(0, inputLength);
    });
    if(typeof input !== 'undefined') {
        input = new Buffer(input);
        inputLength = input.length;
        req.write(input);
    }
    req.on('error', function(e) {
        if(cb === null) {
            return;
        }
        cb(e);
        cb = null;
    });
    req.end();
    promise = function() {
        if(cb === null) {
            return;
        }

        // these statements are in case "abort" is called in "finished" callback
        var _cb = cb;
        cb = null;
        _cb(new Error('abort'));
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

module.exports = httpinvoke;
