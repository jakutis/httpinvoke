var http = require('http');
var cfg = require('./dummyserver-config');
var daemon = require('daemon');
var fs = require('fs');
var mime = require('mime');
var zlib = require('zlib');
var promptly = require('promptly');
var sb = require('surfboard');
var cookie = require('cookie');
var open = sb.openUrl;

var hello = new Buffer('Hello World\n', 'utf8');

var compress = function(output, encoding, cb) {
    'use strict';
    if(encoding === 'gzip') {
        zlib.gzip(output, cb);
    } else if(encoding === 'deflate') {
        zlib.deflateRaw(output, cb);
    } else if(encoding === 'identity'){
        process.nextTick(function() {
            cb(null, output);
        });
    } else {
        process.nextTick(function() {
            cb(new Error('unsupported encoding ' + encoding));
        });
    }
};

var readEntityBody = function(req, text, cb) {
    'use strict';
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
    'use strict';
    return str.substr(str.length - substr.length) === substr;
};

var beginsWith = function(str, substr) {
    'use strict';
    return str.substr(0, substr.length) === substr;
};

// on some Android devices CORS implementations are buggy
// that is why there needs to be two workarounds:
// 1. custom header with origin has to be passed, because they do not send Origin header on the actual request
// 2. caching must be disabled on serverside, because of unknown reasons, and when developing, you should clear cache on device, after disabling the cache on serverside
// read more: http://www.kinvey.com/blog/107/how-to-build-a-service-that-supports-every-android-browser

var corsHeaders = function(headers, req) {
    'use strict';
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'OPTIONS, POST, HEAD, PATCH, PUT, DELETE, GET';
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
    'use strict';
    // workaround for #2: avoiding cache
    headers.Pragma = 'no-cache';
    headers.Expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
    headers['Last-Modified'] = new Date().toGMTString();
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0';
};

var bigHello = function(req, res, interval) {
    'use strict';
    var entity = 'This School Is Not Falling Apart.\n';
    var n = 100, headers = {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Length': entity.length * n * 100
    };
    corsHeaders(headers, req);
    res.writeHead(200, headers);

    var i = 0;
    var id = setInterval(function() {
        if(i < n) {
            for(var j = 0; j < 100; j+=1) {
                res.write(entity);
            }
            i += 1;
        } else {
            clearInterval(id);
            res.end();
        }
    }, interval);
};

var outputStatus = function(req, res) {
    'use strict';
    var code, i, max = 0;
    Object.keys(cfg.status).forEach(function(code) {
        Object.keys(cfg.status[code]).forEach(function(method) {
            if(max < cfg.status[code][method].length) {
                max = cfg.status[code][method].length;
            }
        });
    });
    if(Object.keys(cfg.status).some(function(_code) {
        code = _code;
        if(endsWith(req.url, '/status/' + code)) {
            for(i = 0; i < max; i += 1) {
                if(req.url === req.proxyPath + '/' + i + '/status/' + code) {
                    break;
                }
            }
            return true;
        }
    })) {
        if(typeof cfg.status[code][req.method] !== 'undefined') {
            readEntityBody(req, false, function() {
                var params = cfg.status[code][req.method][i];
                var headers = {};
                corsHeaders(headers, req);
                if(params.location) {
                    headers.Location = 'http://' + req.headers.host + req.proxyPath + '/';
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
            });
        }
        return true;
    }
    return false;
};

var listen = function (req, res) {
    'use strict';
    var headers;

    req.proxyPath = req.url.substr(0, cfg.proxyPath.length) === cfg.proxyPath ? cfg.proxyPath : '';
    res.useChunkedEncodingByDefault = false;

    var output = function(status, body, head, mimeType, headers) {
        headers = headers || {};
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
    var contentEncoding = function(encoding) {
        compress(hello, encoding, function(err, buffer) {
            if(err) {
                return output(200, hello, false, 'text/plain; charset=UTF-8', {
                    'Content-Encoding': encoding
                });
            }
            output(200, buffer, false, 'text/plain; charset=UTF-8', {
                'Content-Encoding': encoding
            });
        });
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
        if(req.url === req.proxyPath + '/noentity') {
            output(204, null, false);
        } else if(req.url === req.proxyPath + '/headers/contentType') {
            output(200, new Buffer(typeof req.headers['content-type'] === 'undefined' ? 'undefined' : req.headers['content-type'], 'utf8'), false, 'text/plain; charset=UTF-8');
        } else if(req.url === req.proxyPath + '/bytearray') {
            readEntityBody(req, false, cfg.makeByteArrayFinished(reportTest));
        } else if(req.url === req.proxyPath + '/text/utf8') {
            readEntityBody(req, true, cfg.makeTextFinished(reportTest));
        } else if(req.url === req.proxyPath + '/boolean') {
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
        if(req.url === req.proxyPath + '/noentity') {
            output(204, null, false);
        } else if(req.url === req.proxyPath + '/') {
            output(200, hello, false, 'text/plain; charset=UTF-8');
        } else if(req.url === req.proxyPath + '/credentials') {
            output(200, new Buffer('cookies=' + (cookie.parse(req.headers.cookie || '').httpinvokeAnonymousTest === '5' ? 'yes' : 'no')), false, 'text/plain; charset=UTF-8');
        } else if(req.url === req.proxyPath + '/immediateEnd') {
            req.socket.destroy();
        } else if(req.url === req.proxyPath + '/endAfterHeaders') {
            headers = {
                'Content-Length': '1024',
                'Content-Type': 'text/plain'
            };
            entityHeaders(headers);
            corsHeaders(headers, req);
            res.writeHead(200, headers);
            req.socket.destroy();
        } else if(req.url === req.proxyPath + '/big') {
            bigHello(req, res, 10);
        } else if(req.url === req.proxyPath + '/bigslow') {
            bigHello(req, res, 1000);
        } else if(beginsWith(req.url, req.proxyPath + '/contentEncoding/')) {
            contentEncoding(req.url.substr((req.proxyPath + '/contentEncoding/').length));
        } else if(req.url === req.proxyPath + '/text/utf8') {
            output(200, new Buffer(cfg.textTest(), 'utf8'), false, 'text/plain; charset=UTF-8');
        } else if(req.url === req.proxyPath + '/text/utf8/empty') {
            output(200, new Buffer('', 'utf8'), false, 'text/plain; charset=UTF-8');
        } else if(req.url === req.proxyPath + '/json') {
            output(200, new Buffer(JSON.stringify(cfg.jsonTest()), 'utf8'), false, 'application/json');
        } else if(req.url === req.proxyPath + '/json/null') {
            output(200, new Buffer('null', 'utf8'), false, 'application/json');
        } else if(req.url === req.proxyPath + '/bytearray') {
            output(200, new Buffer(cfg.bytearrayTest()), false, 'application/octet-stream');
        } else if(req.url === req.proxyPath + '/bytearray/empty') {
            output(200, new Buffer([]), false, 'application/octet-stream');
        } else if(req.url === req.proxyPath + '/twosecondDownload') {
            headers = {
                'Content-Length': '10244',
                'Content-Type': 'text/plain'
            };
            entityHeaders(headers);
            corsHeaders(headers, req);
            res.writeHead(200, headers);
            res.write(new Buffer(new Array(10241).join('.')));
            setTimeout(function() {
                res.end(new Buffer('test'));
            }, 2000);
        } else if(req.url === req.proxyPath + '/twosecondUpload') {
            setTimeout(function() {
                output(200, hello, false, 'text/plain; charset=UTF-8');
            }, 2000);
        } else {
            var url = req.url.substr(req.proxyPath.length);
            if(url.lastIndexOf('?') >= 0) {
                url = url.substr(0, url.lastIndexOf('?'));
            }
            fs.realpath(__dirname + url, function(err, path) {
                if(err || path.substr(0, __dirname.length) !== __dirname) {
                    return output(404, null, false);
                }
                fs.readFile(path, function(err, contents) {
                    if(err) {
                        return output(404, null, false);
                    }
                    output(200, contents, false, mime.lookup(path));
                });
            });
        }
    } else {
        output(406, hello, false, 'text/plain; charset=UTF-8');
    }
};

var testURL = 'http://localhost:' + cfg.dummyserverPort + '/test/index.html';

var startListen = function() {
    'use strict';
    console.log('HTML test runner available at ' + testURL);
    if(process.argv.indexOf('nodaemon') < 0) {
        daemon();
    }
    fs.writeFileSync('./dummyserver.pid', String(process.pid));
    http.createServer(listen).listen(cfg.dummyserverPort, cfg.host);
    http.createServer(listen).listen(cfg.dummyserverPortAlternative, cfg.host);
};

if(fs.existsSync('./dummyserver.pid')) {
    console.log('Error: file ./dummyserver.pid already exists');
    process.exit(1);
} else if(process.argv.indexOf('suggestopen') < 0 || process.env.__daemon) {
    startListen();
} else {
    promptly.confirm('Do you want to open it in the browser? ', function (err, openConfirmed) {
        'use strict';
        if(err) {
            throw err;
        }
        if(openConfirmed) {
            open(testURL);
        }
        startListen();
    });
}
