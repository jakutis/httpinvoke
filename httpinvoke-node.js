var http = require('http');
var url = require('url');

var noop = function() {};
var supportedMethods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'];
var httpinvoke = function(uri, method, options) {
    if(typeof method === 'undefined') {
        method = 'GET';
        options = {};
    } else if(typeof options === 'undefined') {
        if(typeof method === 'string') {
            options = {};
        } else {
            options = method;
            method = 'GET';
        }
    }
    options = typeof options === 'function' ? {
        finished: options
    } : options;

    var uploadProgressCb = options.uploading || noop;
    var downloadProgressCb = options.downloading || noop;
    var statusCb = options.gotStatus || noop;
    var cb = options.finished || noop;
    var input = options.input || null, inputLength = input === null ? 0 : input.length, inputHeaders = options.headers || [];
    var output, outputLength, outputHeaders = {};

    var failWithoutRequest = function(err) {
        process.nextTick(function() {
            if(cb === null) {
                return;
            }
            cb(err);
        });
        return noop;
    };
    if(supportedMethods.indexOf(method) < 0) {
        return failWithoutRequest(new Error('Unsupported method ' + method));
    }


    uri = url.parse(uri);
    var req = http.request({
        hostname: uri.hostname,
        port: Number(uri.port),
        path: uri.path,
        method: method
    }, function(res) {
        if(cb === null) {
            return;
        }

        uploadProgressCb(inputLength, inputLength);
        if(cb === null) {
            return;
        }

        statusCb(res.statusCode, res.headers);
        if(cb === null) {
            return;
        }

        if(typeof res.headers['content-length'] === 'undefined') {
            downloadProgressCb(0, 0);
            if(cb === null) {
                return;
            }
            downloadProgressCb(0, 0);
            if(cb === null) {
                return;
            }
            cb(null, '');
            return;
        }
        outputLength = Number(res.headers['content-length']);
        downloadProgressCb(0, outputLength);
        if(cb === null) {
            return;
        }
        var output = '';
        res.setEncoding('binary');
        res.on('data', function(chunk) {
            if(cb === null) {
                return;
            }
            output += chunk;

            downloadProgressCb(output.length, outputLength);
            if(cb === null) {
                return;
            }
        });
        res.on('end', function() {
            if(cb === null) {
                return;
            }

            downloadProgressCb(outputLength, outputLength);
            if(cb === null) {
                return;
            }

            cb(null, output);
        });
    });

    process.nextTick(function() {
        if(cb === null) {
            return;
        }
        uploadProgressCb(0, inputLength);
    });
    if(input !== null) {
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
httpinvoke.cors = true;
httpinvoke.corsCredentials = true;

module.exports = httpinvoke;
