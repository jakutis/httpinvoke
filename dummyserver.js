var http = require('http');
var cfg = require('./dummyserver-config');

http.createServer(function (req, res) {
    if(req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': '',
            'Content-Length': '0'
        });
        res.end('');
    } else if(req.method === 'GET') {
        var str = 'Hello World\n';
        var headers = {
            'Content-Type': 'text/plain',
            'Content-Length': String(str.length)
        };
        if(typeof req.headers.origin === 'string') {
            headers['Access-Control-Allow-Origin'] = req.headers.origin;
        }
        res.writeHead(200, headers);
        res.end(str);
    } else {
        res.writeHead(406);
        res.end();
    }
}).listen(cfg.port, cfg.host);
