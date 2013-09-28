var http = require('http');
var url = require('url');

var common;

var httpinvoke = function() {
    var c = common.initialize.apply(null, arguments);
    /*************** initialize helper variables **************/
    var ignorantlyConsume = function(res) {
        res.on('data', common.noop);
        res.on('end', common.noop);
    };
    var uri = url.parse(c.uri);
    if(c.timeout > 0) {
        setTimeout(function() {
            c.cb(new Error('Timeout of ' + c.timeout + 'ms exceeded'));
            c.cb = null;
        }, c.timeout);
    }
    var req = http.request({
        hostname: uri.hostname,
        port: Number(uri.port),
        path: uri.path,
        method: c.method,
        headers: c.inputHeaders
    }, function(res) {
        if(c.cb === null) {
            ignorantlyConsume(res);
            return;
        }
        c.outputHeaders = res.headers;
        c.status = res.statusCode;

        c.uploadProgressCb(c.inputLength, c.inputLength);
        if(c.cb === null) {
            ignorantlyConsume(res);
            return;
        }

        c.statusCb(c.status, c.outputHeaders);
        if(c.cb === null) {
            ignorantlyConsume(res);
            return;
        }

        c.updateDownload(0);
        if(c.cb === null) {
            ignorantlyConsume(res);
            return;
        }
        if(typeof c.outputHeaders['content-length'] !== 'undefined') {
            c.initDownload(Number(c.outputHeaders['content-length']));
            if(c.cb === null) {
                ignorantlyConsume(res);
                return;
            }
        }
        if(c.method === 'HEAD' || typeof c.outputHeaders['content-type'] === 'undefined') {
            ignorantlyConsume(res);
            return c.noData();
        }

        var output = [], downloaded = 0;
        res.on('data', function(chunk) {
            if(c.cb === null) {
                return;
            }
            downloaded += chunk.length;
            output.push(chunk);
            c.updateDownload(downloaded);
            if(c.cb === null) {
                return;
            }
        });
        res.on('end', function() {
            if(c.cb === null) {
                return;
            }
            c.updateDownload(downloaded);
            if(c.cb === null) {
                return;
            }

            if(typeof c.outputLength === 'undefined') {
                c.outputLength = downloaded;
            }

            output = Buffer.concat(output, downloaded);
            if(c.outputType === 'text') {
                output = output.toString('utf8');
            }
            try {
                c.cb(null, c.outputConverter(output), c.status, c.outputHeaders);
            } catch(err) {
                c.cb(err);
            }
            c.cb = null;
        });
    });

    process.nextTick(function() {
        if(c.cb === null) {
            return;
        }
        c.uploadProgressCb(0, c.inputLength);
    });
    if(typeof c.input !== 'undefined') {
        c.input = new Buffer(c.input);
        c.inputLength = c.input.length;
        req.write(c.input);
    }
    req.on('error', function(e) {
        if(c.cb === null) {
            return;
        }
        c.cb(e);
        c.cb = null;
    });
    req.end();
    return function() {
        if(c.cb === null) {
            return;
        }

        // these statements are in case "abort" is called in "finished" callback
        var _cb = c.cb;
        c.cb = null;
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
