var http = require('http');
var fs = require('fs');

var serveFile = function(res, filename, mimeType) {
    'use strict';
    fs.readFile(filename, function(err, file) {
        if(err) {
            res.writeHead(500);
            res.end();
            return;
        }
        res.writeHead(200, {
            'Content-Type': mimeType,
            'Content-Length': file.length
        });
        res.end(file);
    });
};

var noop = function() {
    'use strict';
};

http.createServer(function (req, res) {
    'use strict';
    console.log(req.method + ' ' + req.url);
    if(req.method === 'GET') {
        if(req.url === '/httpinvoke.js') {
            serveFile(res, __dirname + '/../httpinvoke-browser.js', 'text/javascript; charset=UTF-8');
        } else if(req.url === '/json2.js') {
            serveFile(res, __dirname + '/json2.js', 'text/javascript; charset=UTF-8');
        } else {
            serveFile(res, __dirname + '/index.html', 'text/html; charset=UTF-8');
        }
    } else if(req.method === 'POST') {
        var entity = new Buffer('Ši mokykla negriūva.\n');
        var n = 100;
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=UTF-8',
            'Content-Length': entity.length * n
        });

        // produces the wanted side effect of consuming all of the request data
        req.on('data', noop);

        req.on('end', function() {
            var i = 0;
            var interval = setInterval(function() {
                if(i < n) {
                    res.write(entity);
                    i += 1;
                } else {
                    clearInterval(interval);
                    res.end();
                }
            }, 100);
        });
    } else {
        res.writeHead(405);
        res.end();
    }
}).listen(8082, '0.0.0.0');
