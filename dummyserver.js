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

var endsWith = function(str, substr) {
    return str.substr(str.length - substr.length) === substr;
};


http.createServer(function (req, res) {
    res.useChunkedEncodingByDefault = false;

    var output = function(status, body, head, mimeType) {
        var headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, POST, HEAD, PUT, DELETE, GET',
            'Access-Control-Allow-Headers': ''
        };
        if(body !== null) {
            headers['Content-Type'] = mimeType;
            headers['Content-Length'] = String(body.length);
            headers['Content-Range'] = 'bytes 0-' + (body.length - 1) + '/' + body.length;
        }
        if(typeof req.headers.origin === 'string') {
            headers['Access-Control-Allow-Origin'] = req.headers.origin;
        }
        res.writeHead(status, headers);
        if(body === null || head) {
            res.end();
        } else {
            res.end(body);
        }
    };
    var hello = 'Hello World\n';

    if(req.method === 'OPTIONS') {
        output(200, hello, false, 'text/plain; charset=UTF-8');
    } else if(req.method === 'POST') {
        if(endsWith(req.url, '/204')) {
            output(204, null, false);
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
        } else if(endsWith(req.url, '/json')) {
            output(200, new Buffer(JSON.stringify(cfg.jsonTest()), 'utf8'), false, 'application/json');
        } else if(endsWith(req.url, '/json/null')) {
            output(200, new Buffer('null', 'utf8'), false, 'application/json');
        } else if(endsWith(req.url, '/bytearray')) {
            output(200, new Buffer(cfg.bytearrayTest()), false, 'application/octet-stream');
        } else if(endsWith(req.url, '/error')) {
            res.end();
        } else {
            output(200, hello, false, 'text/plain; charset=UTF-8');
        }
    } else {
        output(406, hello, false, 'text/plain; charset=UTF-8');
    }
}).listen(cfg.port, cfg.host);
