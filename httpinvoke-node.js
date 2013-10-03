var http = require('http');
var url = require('url');

;;var isArrayBufferView = function(input) {
    return typeof input === 'object' && input !== null && (
        (typeof global.ArrayBufferView !== 'undefined' && input instanceof global.ArrayBufferView) ||
        (typeof global.Int8Array !== 'undefined' && input instanceof global.Int8Array) ||
        (typeof global.Uint8Array !== 'undefined' && input instanceof global.Uint8Array) ||
        (typeof global.Uint8ClampedArray !== 'undefined' && input instanceof global.Uint8ClampedArray) ||
        (typeof global.Int16Array !== 'undefined' && input instanceof global.Int16Array) ||
        (typeof global.Uint16Array !== 'undefined' && input instanceof global.Uint16Array) ||
        (typeof global.Int32Array !== 'undefined' && input instanceof global.Int32Array) ||
        (typeof global.Uint32Array !== 'undefined' && input instanceof global.Uint32Array) ||
        (typeof global.Float32Array !== 'undefined' && input instanceof global.Float32Array) ||
        (typeof global.Float64Array !== 'undefined' && input instanceof global.Float64Array)
    );
};
var isByteArray = function(input) {
    return typeof input === 'object' && input !== null && (
        (typeof global.Buffer !== 'undefined' && input instanceof global.Buffer) ||
        (typeof global.Blob !== 'undefined' && input instanceof global.Blob) ||
        (typeof global.File !== 'undefined' && input instanceof global.File) ||
        (typeof global.ArrayBuffer !== 'undefined' && input instanceof global.ArrayBuffer) ||
        isArrayBufferView(input) ||
        Object.prototype.toString.call(input) === '[object Array]'
    );
};
var bytearrayMessage = 'an instance of Buffer, nor Blob, nor File, nor ArrayBuffer, nor ArrayBufferView, nor Int8Array, nor Uint8Array, nor Uint8ClampedArray, nor Int16Array, nor Uint16Array, nor Int32Array, nor Uint32Array, nor Float32Array, nor Float64Array, nor Array';

var supportedMethods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'];
var indexOf = typeof [].indexOf === 'undefined' ? function(array, item) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i] === item) {
            return i;
        }
    }
    return -1;
} : function(array, item) {
    return array.indexOf(item);
};

var noop = function() {};
var pass = function(value) {
    return value;
};
var nextTick = global.setImmediate || global.setTimeout;
var failWithoutRequest = function(cb, err) {
    nextTick(function() {
        if(cb === null) {
            return;
        }
        cb(err);
    });
    return noop;
};
;

// http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader()-method
var forbiddenInputHeaders = ['accept-charset', 'accept-encoding', 'access-control-request-headers', 'access-control-request-method', 'connection', 'content-length', 'content-transfer-encoding', 'cookie', 'cookie2', 'date', 'dnt', 'expect', 'host', 'keep-alive', 'origin', 'referer', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'user-agent', 'via'];
var validateInputHeaders = function(headers) {
    for(var header in headers) {
        if(headers.hasOwnProperty(header)) {
            var headerl = header.toLowerCase();
            if(forbiddenInputHeaders.indexOf(headerl) >= 0) {
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
    ;var uploadProgressCb, cb, inputLength, inputType, noData, timeout, corsCredentials, inputHeaders, corsOriginHeader, statusCb, initDownload, updateDownload, outputHeaders, exposedHeaders, status, outputType, input, outputLength, outputConverter, _undefined;
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
uploadProgressCb = safeCallback('uploading');
var downloadProgressCb = safeCallback('downloading');
statusCb = safeCallback('gotStatus');
cb = safeCallback('finished');
timeout = options.timeout || 0;
var converters = options.converters || {};
var inputConverter;
inputLength = 0;
inputHeaders = options.headers || {};
outputType = options.outputType || "text";
outputHeaders = {};
exposedHeaders = options.corsExposedHeaders || [];
exposedHeaders.push.apply(exposedHeaders, ['Cache-Control', 'Content-Language', 'Content-Type', 'Content-Length', 'Expires', 'Last-Modified', 'Pragma', 'Content-Range']);
corsOriginHeader = options.corsOriginHeader || 'X-Httpinvoke-Origin';
corsCredentials = !!options.corsCredentials;
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
    input = options.input;
    if(typeof options.inputType === 'undefined' || options.inputType === 'auto') {
        if(typeof input === 'string') {
            inputType = 'text';
        } else if(isByteArray(input)) {
            inputType = 'bytearray';
        } else {
            return failWithoutRequest(cb, new Error('inputType is undefined or auto and input is neither string, nor ' + bytearrayMessage));
        }
    } else {
        inputType = options.inputType;
        if(inputType === 'text') {
            if(typeof input !== 'string') {
                return failWithoutRequest(cb, new Error('inputType is text, but input is not a string'));
            }
        } else if (inputType === 'bytearray') {
            if(!isByteArray(input)) {
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
        if(typeof inputHeaders['Content-Type'] === 'undefined') {
            inputHeaders['Content-Type'] = 'application/octet-stream';
        }
        if(typeof ArrayBuffer !== 'undefined' && input instanceof ArrayBuffer) {
            input = new Uint8Array(input);
        } else if((typeof Int16Array !== 'undefined' && input instanceof Int16Array) || (typeof Uint16Array !== 'undefined' && input instanceof Uint16Array) || (typeof Int32Array !== 'undefined' && input instanceof Int32Array) || (typeof Uint32Array !== 'undefined' && input instanceof Uint32Array) || (typeof Float32Array !== 'undefined' && input instanceof Float32Array) || (typeof Float64Array !== 'undefined' && input instanceof Float64Array)) {
            input = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
        }
    }
    try {
        input = inputConverter(input);
    } catch(err) {
        return failWithoutRequest(cb, err);
    }
}

/*************** COMMON initialize helper variables **************/
var downloaded;
initDownload = function(total) {
    if(typeof outputLength !== 'undefined') {
        return;
    }
    outputLength = total;

    downloadProgressCb(downloaded, outputLength);
};
updateDownload = function(value) {
    if(value === downloaded) {
        return;
    }
    downloaded = value;

    downloadProgressCb(downloaded, outputLength);
};
noData = function() {
    initDownload(0);
    if(cb === null) {
        return;
    }
    cb(null, _undefined, status, outputHeaders);
    cb = null;
};
;
    /*************** initialize helper variables **************/
    try {
        validateInputHeaders(inputHeaders);
    } catch(err) {
        return failWithoutRequest(cb, err);
    }
    var ignorantlyConsume = function(res) {
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
            ignorantlyConsume(res);
            return;
        }
        outputHeaders = res.headers;
        status = res.statusCode;

        uploadProgressCb(inputLength, inputLength);
        if(cb === null) {
            ignorantlyConsume(res);
            return;
        }

        statusCb(status, outputHeaders);
        if(cb === null) {
            ignorantlyConsume(res);
            return;
        }

        updateDownload(0);
        if(cb === null) {
            ignorantlyConsume(res);
            return;
        }
        if(typeof outputHeaders['content-length'] !== 'undefined') {
            initDownload(Number(outputHeaders['content-length']));
            if(cb === null) {
                ignorantlyConsume(res);
                return;
            }
        }
        if(method === 'HEAD' || typeof outputHeaders['content-type'] === 'undefined') {
            ignorantlyConsume(res);
            return noData();
        }

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
        input = new Buffer(input);
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
