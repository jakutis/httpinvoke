var http = require('http');
var url = require('url');

var noop = function() {};
var pass = function(value) {
    return value;
};
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

var isByteArray = function(input) {
    return typeof input === 'object' && input !== null && (input instanceof Buffer || input instanceof ArrayBuffer || Object.prototype.toString.call(input) === '[object Array]');
};
var bytearrayMessage = 'an instance of Buffer, nor ArrayBuffer, nor Array';

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
    var converters = options.converters || {};
    var input, inputConverter, inputType, inputLength = 0, inputHeaders = options.headers || {};
    var outputConverter, outputType = options.outputType || "text";
    var exposedHeaders = options.corsHeaders || [];
    var corsOriginHeader = options.corsOriginHeader || 'X-Httpinvoke-Origin';
    exposedHeaders.push.apply(exposedHeaders, ['Cache-Control', 'Content-Language', 'Content-Type', 'Expires', 'Last-Modified', 'Pragma']);

    /*************** COMMON convert and validate parameters **************/
    if(indexOf(supportedMethods, method) < 0) {
        return failWithoutRequest(cb, new Error('Unsupported method ' + method));
    }
    if(outputType === 'text' || outputType === 'bytearray') {
        outputConverter = pass;
    } else if(typeof converters['text ' + outputType] !== 'undefined') {
        outputConverter = converters['text ' + outputType];
        outputType = 'text';
    } else if(typeof converters['bytearray ' + outputType] !== 'undefined') {
        outputConverter = converters['bytearray ' + outputType];
        outputType = 'bytearray';
    } else {
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
        if(typeof options.inputType === 'undefined' || options.inputType === 'auto') {
            if(typeof options.input === 'string') {
                inputType = 'text';
            } else if(isByteArray(options.input)) {
                inputType = 'bytearray';
            } else {
                return failWithoutRequest(cb, new Error('inputType is undefined or auto and input is neither string, nor ' + bytearrayMessage));
            }
        } else {
            inputType = options.inputType;
            if(inputType === 'text') {
                if(typeof options.input !== 'string') {
                    return failWithoutRequest(cb, new Error('inputType is text, but input is not a string'));
                }
            } else if (inputType === 'bytearray') {
                if(!isByteArray(options.input)) {
                    return failWithoutRequest(cb, new Error('inputType is bytearray, but input is neither ' + bytearrayMessage));
                }
            }
        }
        if(typeof converters[inputType + ' text'] !== 'undefined') {
            inputConverter = converters[inputType + ' text'];
            inputType = 'text';
        } else if(typeof converters[inputType + ' bytearray'] !== 'undefined') {
            inputConverter = converters[inputType + ' bytearray'];
            inputType = 'bytearray';
        } else if(inputType === 'text' || inputType === 'bytearray') {
            inputConverter = pass;
        } else {
            return failWithoutRequest(cb, new Error('There is no converter for specified inputType'));
        }
        if(inputType === 'text') {
            if(typeof inputHeaders['Content-Type'] === 'undefined') {
                inputHeaders['Content-Type'] = 'text/plain; charset=UTF-8';
            }
        } else if(inputType === 'bytearray') {
            if(httpinvoke.requestTextOnly) {
                return failWithoutRequest(cb, new Error('bytearray inputType is not supported on this platform, please always test using requestTextOnly feature flag'));
            }
            if(typeof inputHeaders['Content-Type'] === 'undefined') {
                inputHeaders['Content-Type'] = 'application/octet-stream';
            }
        }
        try {
            input = inputConverter(options.input);
        } catch(err) {
            return failWithoutRequest(cb, err);
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
        if(method !== 'HEAD' && typeof outputHeaders['content-type'] !== 'undefined') {
            cb(new Error('Received Content-Type header, but no entity body'));
            cb = null;
            return;
        }
        initDownload(0);
        if(cb === null) {
            return;
        }
        updateDownload(0);
        if(cb === null) {
            return;
        }
        var _undefined;
        cb(_undefined, _undefined, status, outputHeaders);
        cb = null;
    };
    /*************** initialize helper variables **************/
    var status;
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
        method: method,
        headers: inputHeaders
    }, function(res) {
        if(cb === null) {
            ignoringlyConsume(res);
            return;
        }
        outputHeaders = res.headers;
        status = res.statusCode;

        uploadProgressCb(inputLength, inputLength);
        if(cb === null) {
            ignoringlyConsume(res);
            return;
        }

        statusCb(status, outputHeaders);
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
        if(method === 'HEAD' || typeof outputHeaders['content-type'] === 'undefined') {
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
            if(outputType === 'text') {
                output = output.toString('utf8');
            }
            try {
                cb(null, outputConverter(output), status, outputHeaders);
            } catch(err) {
                cb(err);
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
    if(typeof input !== 'undefined') {
        if(inputType === 'text') {
            inputType = 'bytearray';
            input = new Buffer(input);
        } else if (inputType === 'bytearray' && !(input instanceof Buffer)) {
            if(input instanceof ArrayBuffer) {
                input = new Buffer(new Uint8Array(input));
            } else if(Object.prototype.toString.call(input) === '[object Array]') {
                input = new Buffer(input);
            }
        }
        inputLength = input.length;
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
httpinvoke.corsResponseContentTypeOnly = false;
httpinvoke.corsRequestHeaders = true;
httpinvoke.corsCredentials = true;
httpinvoke.cors = true;
httpinvoke.corsDELETE = true;
httpinvoke.corsHEAD = true;
httpinvoke.corsPUT = true;
httpinvoke.corsStatus = true;
httpinvoke.corsResponseTextOnly = false;
httpinvoke.requestTextOnly = false;

module.exports = httpinvoke;
