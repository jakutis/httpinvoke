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

    var output = function(status, body, head) {
        var headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, POST, HEAD, PUT, DELETE, GET',
            'Access-Control-Allow-Headers': ''
        };
        if(body !== null) {
            headers['Content-Type'] = 'text/plain; charset=UTF-8';
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
        output(200, hello, false);
    } else if(req.method === 'POST') {
        output(200, hello, false);
    } else if(req.method === 'HEAD') {
        output(200, hello, true);
    } else if(req.method === 'PUT') {
        output(200, hello, false);
    } else if(req.method === 'DELETE') {
        output(200, hello, false);
    } else if(req.method === 'GET') {
        if(endsWith(req.url, '/bigslow')) {
            bigslowHello(res);
        } else if(endsWith(req.url, '/utf8')) {
            output(200, new Buffer('Sveika Žeme\n', 'utf8'), false);
        } else {
            output(200, hello, false);
        }
    } else {
        output(406, hello, false);
    }
}).listen(cfg.port, cfg.host);
