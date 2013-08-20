var http = require('http');
var cfg = require('./dummyserver-config');

http.createServer(function (req, res) {
    var hello = function(status, body, head) {
        var str = 'Hello World\n';
        var headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, POST, HEAD, PUT, DELETE, GET',
            'Access-Control-Allow-Headers': ''
        };
        if(body || head) {
            headers['Content-Type'] = 'text/plain';
            headers['Content-Length'] = String(str.length);
            headers['Content-Range'] = 'bytes 0-' + (str.length - 1) + '/' + str.length;
        }
        if(typeof req.headers.origin === 'string') {
            headers['Access-Control-Allow-Origin'] = req.headers.origin;
        }
        res.writeHead(status, headers);
        if(body) {
            res.end(str);
        } else {
            res.end();
        }
    };

    if(req.method === 'OPTIONS') {
        hello(200, true, false);
    } else if(req.method === 'POST') {
        hello(200, true, false);
    } else if(req.method === 'HEAD') {
        hello(200, false, true);
    } else if(req.method === 'PUT') {
        hello(200, true, false);
    } else if(req.method === 'DELETE') {
        hello(200, true, false);
    } else if(req.method === 'GET') {
        hello(200, true, false);
    } else {
        hello(406, false, false);
    }
}).listen(cfg.port, cfg.host);
