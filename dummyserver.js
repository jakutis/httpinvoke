var http = require('http');
var cfg = require('./dummyserver-config');
var daemon = require('daemon');
var fs = require('fs');

var hello = new Buffer('Hello World\n', 'utf8');

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

// on some Android devices CORS implementations are buggy
// that is why there needs to be two workarounds:
// 1. custom header with origin has to be passed, because they do not send Origin header on the actual request
// 2. caching must be disabled on serverside, because of unknown reasons, and when developing, you should clear cache on device, after disabling the cache on serverside
// read more: http://www.kinvey.com/blog/107/how-to-build-a-service-that-supports-every-android-browser

var corsHeaders = function(headers, req) {
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'OPTIONS, POST, HEAD, PUT, DELETE, GET';
    // workaround for #1: the server-side part: need X-Httpinvoke-Origin header
    // workaround for Safari 4.0: need Content-Type header
    headers['Access-Control-Allow-Headers'] = 'Content-Type, If-Modified-Since, Range, X-Httpinvoke-Origin';
    // additional optional headers
    headers['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Location';
    if(typeof req.headers.origin !== 'undefined') {
        headers['Access-Control-Allow-Origin'] = req.headers.origin;
    } else if(typeof req.headers['x-httpinvoke-origin'] !== 'undefined') {
        // workaround for #1: the server-side part
        headers['Access-Control-Allow-Origin'] = req.headers['x-httpinvoke-origin'];
    }
};

var entityHeaders = function(headers) {
    // workaround for #2: avoiding cache
    headers.Pragma = 'no-cache';
    headers.Expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
    headers['Last-Modified'] = new Date().toGMTString();
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0';
};

var outputStatus = function(req, res) {
    var code, i;
    if(Object.keys(cfg.status).some(function(_code) {
        code = _code;
        if(endsWith(req.url, '/status/' + code)) {
            i = 0;
            while(true) {
                if(endsWith(req.url, '/' + i + '/status/' + code)) {
                    break;
                }
                i += 1;
            }
            return true;
        }
    })) {
        if(typeof cfg.status[code][req.method] !== 'undefined') {
            var params = cfg.status[code][req.method][i];
            var headers = {};
            corsHeaders(headers, req);
            if(params.location) {
                headers.Location = 'http://' + req.headers.host + req.url.substr(0, req.url.length - ('/' + i + '/status/' + code).length);
                res.writeHead(Number(code), headers);
                res.end();
            } else if(params.responseEntity) {
                entityHeaders(headers);
                headers['Content-Type'] = 'text/plain';
                if(params.partialResponse) {
                    headers['Accept-Ranges'] = 'bytes';
                    headers['Content-Range'] = 'bytes 0-4/' + hello.length;
                    headers['Content-Length'] = '5';
                    res.writeHead(Number(code), headers);
                    res.end(hello.slice(0, 5));
                } else {
                    headers['Content-Length'] = String(hello.length);
                    res.writeHead(Number(code), headers);
                    res.end(hello);
                }
            } else {
                if(code === '407') {
                    headers['Proxy-Authenticate'] = 'Basic realm="httpinvoke"';
                }
                res.writeHead(Number(code), headers);
                res.end();
            }
        }
        return true;
    }
    return false;
};

var listen = function (req, res) {
    res.useChunkedEncodingByDefault = false;

    var output = function(status, body, head, mimeType) {
        var headers = {
        };
        if(body !== null) {
            entityHeaders(headers);
            headers['Content-Type'] = mimeType;
            headers['Content-Length'] = String(body.length);
        }
        corsHeaders(headers, req);
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

    if(req.method === 'OPTIONS') {
        return output(200, new Buffer([]), false, 'text/plain; charset=UTF-8');
    }
    if(outputStatus(req, res)) {
        return;
    }
    if(req.method === 'POST') {
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
};

if(fs.existsSync('./dummyserver.pid')) {
    console.log('Error: file ./dummyserver.pid already exists');
    process.exit(1);
} else {
    daemon();
    fs.writeFileSync('./dummyserver.pid', String(process.pid));
    http.createServer(listen).listen(cfg.port, cfg.host);
}
