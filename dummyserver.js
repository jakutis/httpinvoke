var http = require('http');
var cfg = require('./dummyserver-config');

var bigslowHello = function(res) {
    var entity = 'This School Is Not Falling Apart.\n';
    var n = 100;
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Length': entity.length * n * 100
    });

    var i = 0;
    var interval = setInterval(function() {
        if(i < n) {
            for(var j = 0; j < 100; j+=1) {
                res.write(entity);
            }
            i += 1;
        } else {
            clearInterval(interval);
            res.end();
        }
    }, 1000);
};

var readEntityBody = function(req, text, cb) {
    var chunks = [];
    req.on('data', function(chunk) {
        chunks.push(chunk);
    });
    req.on('end', function() {
        var body = Buffer.concat(chunks);
        if(text) {
            cb(null, body.toString('utf8'));
        } else {
            cb(null, body);
        }
    });
};

var endsWith = function(str, substr) {
    return str.substr(str.length - substr.length) === substr;
};

http.createServer(function (req, res) {
    res.useChunkedEncodingByDefault = false;

    var output = function(status, body, head, mimeType) {
        // on some Android devices CORS implementations are buggy
        // that is why there needs to be two workarounds:
        // 1. custom header with origin has to be passed, because they do not send Origin header on the actual request
        // 2. caching must be disabled on serverside, because of unknown reasons, and when developing, you should clear cache on device, after disabling the cache on serverside
        // read more: http://www.kinvey.com/blog/107/how-to-build-a-service-that-supports-every-android-browser

        var headers = {
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, POST, HEAD, PUT, DELETE, GET',
            // workaround for #1: the server-side part: need X-Httpinvoke-Origin header
            // workaround for Safari 4.0: need Content-Type header
            'Access-Control-Allow-Headers': 'Content-Type, X-Httpinvoke-Origin',
            // workaround for #2: avoiding cache
            'Pragma': 'no-cache',
            'Expires': 'Thu, 01 Jan 1970 00:00:00 GMT',
            'Last-Modified': new Date().toGMTString(),
            'Cache-Control': 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0'
        };
        if(body !== null) {
            headers['Content-Type'] = mimeType;
            headers['Content-Length'] = String(body.length);
        }
        if(typeof req.headers.origin !== 'undefined') {
            headers['Access-Control-Allow-Origin'] = req.headers.origin;
        } else if(typeof req.headers['x-httpinvoke-origin'] !== 'undefined') {
            // workaround for #1: the server-side part
            headers['Access-Control-Allow-Origin'] = req.headers['x-httpinvoke-origin'];
        }
        res.writeHead(status, headers);
        if(body === null || head) {
            res.end();
        } else {
            res.end(body);
        }
    };
    var reportTest = function(err) {
        if(err) {
            return output(200, new Buffer(err.stack, 'utf8'), false, 'text/plain; charset=UTF-8');
        }
        output(200, new Buffer('OK', 'utf8'), false, 'text/plain; charset=UTF-8');
    };
    var hello = new Buffer('Hello World\n', 'utf8');

    if(req.method === 'OPTIONS') {
        output(200, new Buffer([]), false, 'text/plain; charset=UTF-8');
    } else if(req.method === 'POST') {
        if(endsWith(req.url, '/noentity')) {
            output(204, null, false);
        } else if(endsWith(req.url, '/headers/contentType')) {
            output(200, new Buffer(typeof req.headers['content-type'] === 'undefined' ? 'undefined' : req.headers['content-type'], 'utf8'), false, 'text/plain; charset=UTF-8');
        } else if(endsWith(req.url, '/bytearray')) {
            readEntityBody(req, false, cfg.makeByteArrayFinished(reportTest));
        } else if(endsWith(req.url, '/text/utf8')) {
            readEntityBody(req, true, cfg.makeTextFinished(reportTest));
        } else if(endsWith(req.url, '/boolean')) {
            readEntityBody(req, false, function(err, input) {
                output(200, input, false, 'text/plain; charset=UTF-8');
            });
        } else {
            output(200, hello, false, 'text/plain; charset=UTF-8');
        }
    } else if(req.method === 'HEAD') {
        output(200, hello, true, 'text/plain; charset=UTF-8');
    } else if(req.method === 'PUT') {
        output(200, hello, false, 'text/plain; charset=UTF-8');
    } else if(req.method === 'DELETE') {
        output(200, hello, false, 'text/plain; charset=UTF-8');
    } else if(req.method === 'GET') {
        if(endsWith(req.url, '/bigslow')) {
            bigslowHello(res);
        } else if(endsWith(req.url, '/text/utf8')) {
            output(200, new Buffer(cfg.textTest(), 'utf8'), false, 'text/plain; charset=UTF-8');
        } else if(endsWith(req.url, '/text/utf8/empty')) {
            output(200, new Buffer('', 'utf8'), false, 'text/plain; charset=UTF-8');
        } else if(endsWith(req.url, '/json')) {
            output(200, new Buffer(JSON.stringify(cfg.jsonTest()), 'utf8'), false, 'application/json');
        } else if(endsWith(req.url, '/json/null')) {
            output(200, new Buffer('null', 'utf8'), false, 'application/json');
        } else if(endsWith(req.url, '/bytearray')) {
            output(200, new Buffer(cfg.bytearrayTest()), false, 'application/octet-stream');
        } else if(endsWith(req.url, '/bytearray/empty')) {
            output(200, new Buffer([]), false, 'application/octet-stream');
        } else if(endsWith(req.url, '/tenseconds')) {
            setTimeout(function() {
                output(200, hello, false, 'text/plain; charset=UTF-8');
            }, 10000);
        } else {
            output(200, hello, false, 'text/plain; charset=UTF-8');
        }
    } else {
        output(406, hello, false, 'text/plain; charset=UTF-8');
    }
}).listen(cfg.port, cfg.host);
