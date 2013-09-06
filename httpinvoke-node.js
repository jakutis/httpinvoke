var http = require('http');
var url = require('url');

var noop = function() {};
var supportedMethods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'];
var failWithoutRequest = function(cb, err) {
    process.nextTick(function() {
        if(cb === null) {
            return;
        }
        cb(err);
    });
    return noop;
};
var indexOf = function(array, item) {
    return array.indexOf(item);
};
var countStringBytes = function(string) {
    var n = 0;
    for(var i = 0; i < string.length; i += 1) {
        var c = string.charCodeAt(i);
        if (c < 128) {
            n += 1;
        } else if (c < 2048) {
            n += 2;
        } else {
            n += 3;
        }
    }
    return n;
};
var convertByteArrayToBinaryString = function(bytearray) {
    var str = '';
    for(var i = 0; i < bytearray.length; i += 1) {
        str += String.fromCharCode(bytearray[i]);
    }
    return str;
};
// http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader()-method
var forbiddenInputHeaders = ['accept-charset', 'accept-encoding', 'access-control-request-headers', 'access-control-request-method', 'connection', 'content-length', 'content-transfer-encoding', 'cookie', 'cookie2', 'date', 'dnt', 'expect', 'host', 'keep-alive', 'origin', 'referer', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'user-agent', 'via'];
var validateInputHeaders = function(headers) {
    for(var header in headers) {
        if(headers.hasOwnProperty(header)) {
            var headerl = header.toLowerCase();
            if(indexOf(forbiddenInputHeaders, headerl) >= 0) {
                throw new Error('Input header ' + header + ' is forbidden to be set programmatically');
            }
            if(headerl.substr(0, 'proxy-'.length) === 'proxy-') {
                throw new Error('Input header ' + header + ' (to be precise, all Proxy-*) is forbidden to be set programmatically');
            }
            if(headerl.substr(0, 'sec-'.length) === 'sec-') {
                throw new Error('Input header ' + header + ' (to be precise, all Sec-*) is forbidden to be set programmatically');
            }
        }
    }
};

var httpinvoke = function(uri, method, options) {
    /*************** COMMON initialize parameters **************/
    if(typeof method === 'undefined') {
        method = 'GET';
        options = {};
    } else if(typeof options === 'undefined') {
        if(typeof method === 'string') {
            options = {};
        } else {
            options = method;
            method = 'GET';
        }
    }
    options = typeof options === 'function' ? {
        finished: options
    } : options;
    var safeCallback = function(name) {
        if(typeof options[name] === 'undefined') {
            return noop;
        }
        return function() {
            try {
                options[name].apply(null, arguments);
            } catch(_) {
            }
        };
    };
    var uploadProgressCb = safeCallback('uploading');
    var downloadProgressCb = safeCallback('downloading');
    var statusCb = safeCallback('gotStatus');
    var cb = safeCallback('finished');
    var timeout = options.timeout || 0;
    var input, inputLength, inputHeaders = options.headers || {};
    var inputType, inputIsArray;
    var outputType = options.outputType || "text";
    var exposedHeaders = options.corsHeaders || [];
    var corsOriginHeader = options.corsOriginHeader || 'X-Httpinvoke-Origin';
    exposedHeaders.push.apply(exposedHeaders, ['Cache-Control', 'Content-Language', 'Content-Type', 'Expires', 'Last-Modified', 'Pragma']);

    /*************** COMMON convert and validate parameters **************/
    if(indexOf(supportedMethods, method) < 0) {
        return failWithoutRequest(cb, new Error('Unsupported method ' + method));
    }
    if(outputType !== 'text' && outputType !== 'bytearray') {
        return failWithoutRequest(cb, new Error('Unsupported outputType ' + outputType));
    }
    if(typeof options.input === 'undefined') {
        if(typeof options.inputType !== 'undefined') {
            return failWithoutRequest(cb, new Error('"input" is undefined, but inputType is defined'));
        }
        if(typeof inputHeaders['Content-Type'] !== 'undefined') {
            return failWithoutRequest(cb, new Error('"input" is undefined, but Content-Type request header is defined'));
        }
    } else {
        if(typeof options.inputType === 'undefined') {
            inputType = 'auto';
        } else {
            inputType = options.inputType;
            if(inputType !== 'auto' && inputType !== 'text' && inputType !== 'bytearray') {
                return failWithoutRequest(cb, new Error('Unsupported inputType ' + inputType));
            }
        }
        if(inputType === 'auto') {
            if(typeof inputHeaders['Content-Type'] === 'undefined') {
                return failWithoutRequest(cb, new Error('inputType is auto and Content-Type request header is not specified'));
            }
            if(typeof inputHeaders['Content-Type'] === 'undefined') {
                inputType = 'bytearray';
            } else if(inputHeaders['Content-Type'].substr(0, 'text/'.length) === 'text/') {
                inputType = 'text';
            } else {
                inputType = 'bytearray';
            }
        }
        if(inputType === 'text') {
            if(typeof options.input !== 'string') {
                return failWithoutRequest(cb, new Error('inputType is text, but input is not a string'));
            }
            input = options.input;
            inputLength = countStringBytes(input);
            if(typeof inputHeaders['Content-Type'] === 'undefined') {
                inputHeaders['Content-Type'] = 'text/plain; charset=UTF-8';
            }
        } else if(inputType === 'bytearray') {
            if(typeof options.input !== 'object' || options.input === null) {
                return failWithoutRequest(cb, new Error('inputType is bytearray, but input is not a non-null object'));
            }
            if(typeof inputHeaders['Content-Type'] === 'undefined') {
                inputHeaders['Content-Type'] = 'application/octet-stream';
            }
        }
    }

    try {
        validateInputHeaders(inputHeaders);
    } catch(err) {
        return failWithoutRequest(cb, err);
    }
    /*************** COMMON initialize helper variables **************/
    var downloaded, outputHeaders, outputLength;
    var initDownload = function(total) {
        if(typeof outputLength !== 'undefined') {
            return;
        }
        outputLength = total;

        downloadProgressCb(downloaded, outputLength);
    };
    var updateDownload = function(value) {
        if(value === downloaded) {
            return;
        }
        downloaded = value;

        downloadProgressCb(downloaded, outputLength);
    };
    var noData = function() {
        initDownload(0);
        if(cb === null) {
            return;
        }
        updateDownload(0);
        if(cb === null) {
            return;
        }
        cb();
        cb = null;
    };
    /*************** initialize helper variables **************/
    if(inputType === 'bytearray') {
        if(options.input instanceof Buffer) {
            input = options.input;
        } else if(Object.prototype.toString.call(options.input) === '[object Array]') {
            input = new Buffer(options.input);
        } else {
            return failWithoutRequest(cb, new Error('inputType is text, but input is not a string'));
        }
        inputLength = input.length;
    }
    var ignoringlyConsume = function(res) {
        res.on('data', noop);
        res.on('end', noop);
    };
    uri = url.parse(uri);
    if(timeout > 0) {
        setTimeout(function() {
            cb(new Error('Timeout of ' + timeout + 'ms exceeded'));
            cb = null;
        }, timeout);
    }
    var req = http.request({
        hostname: uri.hostname,
        port: Number(uri.port),
        path: uri.path,
        method: method
    }, function(res) {
        if(cb === null) {
            ignoringlyConsume(res);
            return;
        }
        outputHeaders = res.headers;

        uploadProgressCb(inputLength, inputLength);
        if(cb === null) {
            ignoringlyConsume(res);
            return;
        }

        statusCb(res.statusCode, outputHeaders);
        if(cb === null) {
            ignoringlyConsume(res);
            return;
        }

        updateDownload(0);
        // BEGIN COMMON
        if(typeof outputHeaders['content-length'] === 'string') {
            initDownload(Number(outputHeaders['content-length']));
        } else {
            initDownload();
        }
        if(cb === null) {
            ignoringlyConsume(res);
            return;
        }
        if(method === 'HEAD' || typeof outputHeaders['content-type'] === 'undefined' || outputLength === 0) {
            ignoringlyConsume(res);
            return noData();
        }
        // END COMMON

        var output = [], downloaded = 0;
        res.on('data', function(chunk) {
            if(cb === null) {
                return;
            }
            downloaded += chunk.length;
            output.push(chunk);
            updateDownload(downloaded);
            if(cb === null) {
                return;
            }
        });
        res.on('end', function() {
            if(cb === null) {
                return;
            }
            updateDownload(downloaded);
            if(cb === null) {
                return;
            }

            if(typeof outputLength === 'undefined') {
                outputLength = downloaded;
            }
            if(outputLength === 0) {
                return noData();
            }

            if(outputType === 'auto') {
                if(outputHeaders['content-type'] === 'application/json') {
                    outputType = 'json';
                } else if(outputHeaders['content-type'].substr(0, 'text/'.length) === 'text/') {
                    outputType = 'text';
                } else {
                    outputType = 'bytearray';
                }
            }

            output = Buffer.concat(output, downloaded);
            if(outputType === 'bytearray') {
                cb(null, output);
            } else if(outputType === 'text') {
                // TODO check charset in Content-Type response header?
                cb(null, output.toString('utf8'));
            } else if(outputType === 'json') {
                try {
                    cb(null, JSON.parse(output.toString('utf8')));
                } catch(err) {
                    cb(err);
                }
            }
            cb = null;
        });
    });

    process.nextTick(function() {
        if(cb === null) {
            return;
        }
        uploadProgressCb(0, inputLength);
    });
    if(typeof options.input !== 'undefined') {
        if(input instanceof Array) {
            input = new Buffer(input);
        }
        req.write(input);
    }
    req.on('error', function(e) {
        if(cb === null) {
            return;
        }
        cb(e);
        cb = null;
    });
    req.end();
    return function() {
        if(cb === null) {
            return;
        }

        // these statements are in case "abort" is called in "finished" callback
        var _cb = cb;
        cb = null;
        _cb(new Error('abort'));
    };
};
httpinvoke.cors = true;
httpinvoke.corsCredentials = true;

module.exports = httpinvoke;
