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
        if(statusCb) {
            statusCb(res.statusCode, res.headers);
            statusCb = null;
        }
        if(cb) {
            var output = '';
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                output += chunk;
            });
            res.on('end', function() {
                if(cb) {
                    cb(null, output);
                }
            });
        }
    });

    if(input !== null) {
        req.write(input);
    }
    req.on('error', function(e) {
        cb(e);
        deleteCallbacks();
    });
    req.end();
};
