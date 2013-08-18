var http = require('http');
var url = require('url');

var noop = function() {};
module.exports = function(uri, method, options) {
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
    options = options || {};
    var uploadProgressCb = options.uploading || noop;
    var downloadProgressCb = options.downloading || noop;
    var statusCb = options.gotStatus || noop;
    var cb = options.finished || noop;
    var deleteCallbacks = function() {
        uploadProgressCb = null;
        downloadProgressCb = null;
        statusCb = null;
        cb = null;
    };
    var input = options.input || null, inputLength = input === null ? 0 : input.length, inputHeaders = options.headers || [];
    var output, outputLength, outputHeaders = {};

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
        statusCb(res.statusCode, res.headers);
        if(typeof res.headers['content-length'] === 'undefined') {
            downloadProgressCb(0, 0);
            downloadProgressCb(0, 0);
            cb(null, '');
            return;
        }
        outputLength = Number(res.headers['content-length']);
        downloadProgressCb(0, outputLength);
        var output = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            if(cb === null) {
                return;
            }
            downloadProgressCb(output.length, outputLength);
            output += chunk;
        });
        res.on('end', function() {
            if(cb === null) {
                return;
            }
            downloadProgressCb(outputLength, outputLength);
            cb(null, output);
        });
    });

    setTimeout(function() {
        uploadProgressCb(0, inputLength);
    }, 0);
    if(input !== null) {
        req.write(input);
    }
    req.on('error', function(e) {
        cb(e);
        deleteCallbacks();
    });
    req.end();
    return function() {
        // TODO implement abort function
    };
};
