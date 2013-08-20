var http = require('http');
var cfg = require('./dummyserver-config');

http.createServer(function (req, res) {
    var hello = function(body) {
        var str = 'Hello World\n';
        var headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, POST, HEAD, PUT, DELETE, GET',
            'Access-Control-Allow-Headers': '',
            'Content-Type': 'text/plain',
            'Content-Length': String(str.length)
        };
        if(typeof req.headers.origin === 'string') {
            headers['Access-Control-Allow-Origin'] = req.headers.origin;
        }
        res.writeHead(200, headers);
        if(body) {
            res.end(str);
        } else {
            res.end();
        }
    };
    if(req.method === 'OPTIONS') {
        hello(true);
    } else if(req.method === 'POST') {
        hello(true);
    } else if(req.method === 'HEAD') {
        hello(false);
    } else if(req.method === 'PUT') {
        hello(true);
    } else if(req.method === 'DELETE') {
        hello(true);
    } else if(req.method === 'GET') {
        hello(true);
    } else {
        res.writeHead(406);
        res.end();
    }
}).listen(cfg.port, cfg.host);
