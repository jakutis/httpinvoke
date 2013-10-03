var http = require('http');
var url = require('url');

var noop, failWithoutRequest, isArrayBufferView;

var httpinvoke = function(uri, method, options) {
    var uploadProgressCb, cb, inputLength, inputType, noData, timeout, corsCredentials, inputHeaders, corsOriginHeader, statusCb, initDownload, updateDownload, outputHeaders, exposedHeaders, status, outputType, input, outputLength, outputConverter, _undefined;
    /*************** initialize helper variables **************/
    var ignorantlyConsume = function(res) {
        res.on('data', noop);
        res.on('end', noop);
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
            if(outputType === 'text') {
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

    process.nextTick(function() {
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
    return function() {
        if(cb === null) {
            return;
        }

        // these statements are in case "abort" is called in "finished" callback
        var _cb = cb;
        cb = null;
        _cb(new Error('abort'));
    };
};
httpinvoke.corsResponseContentTypeOnly = false;
httpinvoke.corsRequestHeaders = true;
httpinvoke.corsCredentials = true;
httpinvoke.cors = true;
httpinvoke.corsDELETE = true;
httpinvoke.corsHEAD = true;
httpinvoke.corsPUT = true;
httpinvoke.corsStatus = true;
httpinvoke.corsResponseTextOnly = false;
httpinvoke.requestTextOnly = false;

module.exports = httpinvoke;
