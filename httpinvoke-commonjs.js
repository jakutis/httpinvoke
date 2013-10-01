if(typeof process !== 'undefined' && typeof process.versions !== 'undefined' && typeof process.versions.node !== 'undefined') {
;var http = require('http');
var url = require('url');

;var common = function(global) {
    var isArrayBufferView = function(input) {
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
    var initialize = function(uri, method, options) {
        var c = {
            uri: uri
        };
        /*************** COMMON initialize parameters **************/
        if(typeof method === 'undefined') {
            c.method = 'GET';
            options = {};
        } else if(typeof options === 'undefined') {
            if(typeof method === 'string') {
                c.method = method;
                options = {};
            } else {
                c.method = 'GET';
                options = method;
            }
        } else {
            c.method = method;
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
        c.uploadProgressCb = safeCallback('uploading');
        var downloadProgressCb = safeCallback('downloading');
        c.statusCb = safeCallback('gotStatus');
        c.cb = safeCallback('finished');
        c.timeout = options.timeout || 0;
        var converters = options.converters || {};
        var inputConverter;
        c.inputLength = 0;
        c.inputHeaders = options.headers || {};
        c.outputType = options.outputType || "text";
        c.outputHeaders = {};
        c.exposedHeaders = options.corsExposedHeaders || [];
        c.exposedHeaders.push.apply(c.exposedHeaders, ['Cache-Control', 'Content-Language', 'Content-Type', 'Content-Length', 'Expires', 'Last-Modified', 'Pragma', 'Content-Range']);
        c.corsOriginHeader = options.corsOriginHeader || 'X-Httpinvoke-Origin';
        c.corsCredentials = !!options.corsCredentials;
        /*************** COMMON convert and validate parameters **************/
        if(indexOf(supportedMethods, c.method) < 0) {
            return failWithoutRequest(c.cb, new Error('Unsupported method ' + c.method));
        }
        if(c.outputType === 'text' || c.outputType === 'bytearray') {
            c.outputConverter = pass;
        } else if(typeof converters['text ' + c.outputType] !== 'undefined') {
            c.outputConverter = converters['text ' + c.outputType];
            c.outputType = 'text';
        } else if(typeof converters['bytearray ' + c.outputType] !== 'undefined') {
            c.outputConverter = converters['bytearray ' + c.outputType];
            c.outputType = 'bytearray';
        } else {
            return failWithoutRequest(c.cb, new Error('Unsupported outputType ' + c.outputType));
        }
        if(typeof options.input === 'undefined') {
            if(typeof options.inputType !== 'undefined') {
                return failWithoutRequest(c.cb, new Error('"input" is undefined, but inputType is defined'));
            }
            if(typeof c.inputHeaders['Content-Type'] !== 'undefined') {
                return failWithoutRequest(c.cb, new Error('"input" is undefined, but Content-Type request header is defined'));
            }
        } else {
            c.input = options.input;
            if(typeof options.inputType === 'undefined' || options.inputType === 'auto') {
                if(typeof c.input === 'string') {
                    c.inputType = 'text';
                } else if(isByteArray(c.input)) {
                    c.inputType = 'bytearray';
                } else {
                    return failWithoutRequest(c.cb, new Error('inputType is undefined or auto and input is neither string, nor ' + bytearrayMessage));
                }
            } else {
                c.inputType = options.inputType;
                if(c.inputType === 'text') {
                    if(typeof c.input !== 'string') {
                        return failWithoutRequest(c.cb, new Error('inputType is text, but input is not a string'));
                    }
                } else if (c.inputType === 'bytearray') {
                    if(!isByteArray(c.input)) {
                        return failWithoutRequest(c.cb, new Error('inputType is bytearray, but input is neither ' + bytearrayMessage));
                    }
                }
            }
            if(typeof converters[c.inputType + ' text'] !== 'undefined') {
                inputConverter = converters[c.inputType + ' text'];
                c.inputType = 'text';
            } else if(typeof converters[c.inputType + ' bytearray'] !== 'undefined') {
                inputConverter = converters[c.inputType + ' bytearray'];
                c.inputType = 'bytearray';
            } else if(c.inputType === 'text' || c.inputType === 'bytearray') {
                inputConverter = pass;
            } else {
                return failWithoutRequest(c.cb, new Error('There is no converter for specified inputType'));
            }
            if(c.inputType === 'text') {
                if(typeof c.inputHeaders['Content-Type'] === 'undefined') {
                    c.inputHeaders['Content-Type'] = 'text/plain; charset=UTF-8';
                }
            } else if(c.inputType === 'bytearray') {
                if(typeof c.inputHeaders['Content-Type'] === 'undefined') {
                    c.inputHeaders['Content-Type'] = 'application/octet-stream';
                }
                if(typeof ArrayBuffer !== 'undefined' && c.input instanceof ArrayBuffer) {
                    c.input = new Uint8Array(c.input);
                } else if((typeof Int16Array !== 'undefined' && c.input instanceof Int16Array) || (typeof Uint16Array !== 'undefined' && c.input instanceof Uint16Array) || (typeof Int32Array !== 'undefined' && c.input instanceof Int32Array) || (typeof Uint32Array !== 'undefined' && c.input instanceof Uint32Array) || (typeof Float32Array !== 'undefined' && c.input instanceof Float32Array) || (typeof Float64Array !== 'undefined' && c.input instanceof Float64Array)) {
                    c.input = new Uint8Array(c.input.buffer, c.input.byteOffset, c.input.byteLength);
                }
            }
            try {
                c.input = inputConverter(c.input);
            } catch(err) {
                return failWithoutRequest(c.cb, err);
            }
        }

        try {
            validateInputHeaders(c.inputHeaders);
        } catch(err) {
            return failWithoutRequest(c.cb, err);
        }
        /*************** COMMON initialize helper variables **************/
        var downloaded;
        c.initDownload = function(total) {
            if(typeof c.outputLength !== 'undefined') {
                return;
            }
            c.outputLength = total;

            downloadProgressCb(downloaded, c.outputLength);
        };
        c.updateDownload = function(value) {
            if(value === downloaded) {
                return;
            }
            downloaded = value;

            downloadProgressCb(downloaded, c.outputLength);
        };
        c.noData = function() {
            c.initDownload(0);
            if(c.cb === null) {
                return;
            }
            c.cb(null, c._undefined, c.status, c.outputHeaders);
            c.cb = null;
        };
        return c;
    };
    return {
        isArrayBufferView: isArrayBufferView,
        failWithoutRequest: failWithoutRequest,
        initialize: initialize,
        noop: noop
    };
};
;common = common(global);

var httpinvoke = function() {
    var c = common.initialize.apply(null, arguments);
    if(typeof c === 'function') {
        return c;
    }
    /*************** initialize helper variables **************/
    var ignorantlyConsume = function(res) {
        res.on('data', common.noop);
        res.on('end', common.noop);
    };
    var uri = url.parse(c.uri);
    if(c.timeout > 0) {
        setTimeout(function() {
            c.cb(new Error('Timeout of ' + c.timeout + 'ms exceeded'));
            c.cb = null;
        }, c.timeout);
    }
    var req = http.request({
        hostname: uri.hostname,
        port: Number(uri.port),
        path: uri.path,
        method: c.method,
        headers: c.inputHeaders
    }, function(res) {
        if(c.cb === null) {
            ignorantlyConsume(res);
            return;
        }
        c.outputHeaders = res.headers;
        c.status = res.statusCode;

        c.uploadProgressCb(c.inputLength, c.inputLength);
        if(c.cb === null) {
            ignorantlyConsume(res);
            return;
        }

        c.statusCb(c.status, c.outputHeaders);
        if(c.cb === null) {
            ignorantlyConsume(res);
            return;
        }

        c.updateDownload(0);
        if(c.cb === null) {
            ignorantlyConsume(res);
            return;
        }
        if(typeof c.outputHeaders['content-length'] !== 'undefined') {
            c.initDownload(Number(c.outputHeaders['content-length']));
            if(c.cb === null) {
                ignorantlyConsume(res);
                return;
            }
        }
        if(c.method === 'HEAD' || typeof c.outputHeaders['content-type'] === 'undefined') {
            ignorantlyConsume(res);
            return c.noData();
        }

        var output = [], downloaded = 0;
        res.on('data', function(chunk) {
            if(c.cb === null) {
                return;
            }
            downloaded += chunk.length;
            output.push(chunk);
            c.updateDownload(downloaded);
            if(c.cb === null) {
                return;
            }
        });
        res.on('end', function() {
            if(c.cb === null) {
                return;
            }
            c.updateDownload(downloaded);
            if(c.cb === null) {
                return;
            }

            if(typeof c.outputLength === 'undefined') {
                c.outputLength = downloaded;
            }

            output = Buffer.concat(output, downloaded);
            if(c.outputType === 'text') {
                output = output.toString('utf8');
            }
            try {
                c.cb(null, c.outputConverter(output), c.status, c.outputHeaders);
            } catch(err) {
                c.cb(err);
            }
            c.cb = null;
        });
    });

    process.nextTick(function() {
        if(c.cb === null) {
            return;
        }
        c.uploadProgressCb(0, c.inputLength);
    });
    if(typeof c.input !== 'undefined') {
        c.input = new Buffer(c.input);
        c.inputLength = c.input.length;
        req.write(c.input);
    }
    req.on('error', function(e) {
        if(c.cb === null) {
            return;
        }
        c.cb(e);
        c.cb = null;
    });
    req.end();
    return function() {
        if(c.cb === null) {
            return;
        }

        // these statements are in case "abort" is called in "finished" callback
        var _cb = c.cb;
        c.cb = null;
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
;
} else {
;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.httpinvoke = factory();
  }
}(this, function () {
    ;var common = function(global) {
    var isArrayBufferView = function(input) {
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
    var initialize = function(uri, method, options) {
        var c = {
            uri: uri
        };
        /*************** COMMON initialize parameters **************/
        if(typeof method === 'undefined') {
            c.method = 'GET';
            options = {};
        } else if(typeof options === 'undefined') {
            if(typeof method === 'string') {
                c.method = method;
                options = {};
            } else {
                c.method = 'GET';
                options = method;
            }
        } else {
            c.method = method;
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
        c.uploadProgressCb = safeCallback('uploading');
        var downloadProgressCb = safeCallback('downloading');
        c.statusCb = safeCallback('gotStatus');
        c.cb = safeCallback('finished');
        c.timeout = options.timeout || 0;
        var converters = options.converters || {};
        var inputConverter;
        c.inputLength = 0;
        c.inputHeaders = options.headers || {};
        c.outputType = options.outputType || "text";
        c.outputHeaders = {};
        c.exposedHeaders = options.corsExposedHeaders || [];
        c.exposedHeaders.push.apply(c.exposedHeaders, ['Cache-Control', 'Content-Language', 'Content-Type', 'Content-Length', 'Expires', 'Last-Modified', 'Pragma', 'Content-Range']);
        c.corsOriginHeader = options.corsOriginHeader || 'X-Httpinvoke-Origin';
        c.corsCredentials = !!options.corsCredentials;
        /*************** COMMON convert and validate parameters **************/
        if(indexOf(supportedMethods, c.method) < 0) {
            return failWithoutRequest(c.cb, new Error('Unsupported method ' + c.method));
        }
        if(c.outputType === 'text' || c.outputType === 'bytearray') {
            c.outputConverter = pass;
        } else if(typeof converters['text ' + c.outputType] !== 'undefined') {
            c.outputConverter = converters['text ' + c.outputType];
            c.outputType = 'text';
        } else if(typeof converters['bytearray ' + c.outputType] !== 'undefined') {
            c.outputConverter = converters['bytearray ' + c.outputType];
            c.outputType = 'bytearray';
        } else {
            return failWithoutRequest(c.cb, new Error('Unsupported outputType ' + c.outputType));
        }
        if(typeof options.input === 'undefined') {
            if(typeof options.inputType !== 'undefined') {
                return failWithoutRequest(c.cb, new Error('"input" is undefined, but inputType is defined'));
            }
            if(typeof c.inputHeaders['Content-Type'] !== 'undefined') {
                return failWithoutRequest(c.cb, new Error('"input" is undefined, but Content-Type request header is defined'));
            }
        } else {
            c.input = options.input;
            if(typeof options.inputType === 'undefined' || options.inputType === 'auto') {
                if(typeof c.input === 'string') {
                    c.inputType = 'text';
                } else if(isByteArray(c.input)) {
                    c.inputType = 'bytearray';
                } else {
                    return failWithoutRequest(c.cb, new Error('inputType is undefined or auto and input is neither string, nor ' + bytearrayMessage));
                }
            } else {
                c.inputType = options.inputType;
                if(c.inputType === 'text') {
                    if(typeof c.input !== 'string') {
                        return failWithoutRequest(c.cb, new Error('inputType is text, but input is not a string'));
                    }
                } else if (c.inputType === 'bytearray') {
                    if(!isByteArray(c.input)) {
                        return failWithoutRequest(c.cb, new Error('inputType is bytearray, but input is neither ' + bytearrayMessage));
                    }
                }
            }
            if(typeof converters[c.inputType + ' text'] !== 'undefined') {
                inputConverter = converters[c.inputType + ' text'];
                c.inputType = 'text';
            } else if(typeof converters[c.inputType + ' bytearray'] !== 'undefined') {
                inputConverter = converters[c.inputType + ' bytearray'];
                c.inputType = 'bytearray';
            } else if(c.inputType === 'text' || c.inputType === 'bytearray') {
                inputConverter = pass;
            } else {
                return failWithoutRequest(c.cb, new Error('There is no converter for specified inputType'));
            }
            if(c.inputType === 'text') {
                if(typeof c.inputHeaders['Content-Type'] === 'undefined') {
                    c.inputHeaders['Content-Type'] = 'text/plain; charset=UTF-8';
                }
            } else if(c.inputType === 'bytearray') {
                if(typeof c.inputHeaders['Content-Type'] === 'undefined') {
                    c.inputHeaders['Content-Type'] = 'application/octet-stream';
                }
                if(typeof ArrayBuffer !== 'undefined' && c.input instanceof ArrayBuffer) {
                    c.input = new Uint8Array(c.input);
                } else if((typeof Int16Array !== 'undefined' && c.input instanceof Int16Array) || (typeof Uint16Array !== 'undefined' && c.input instanceof Uint16Array) || (typeof Int32Array !== 'undefined' && c.input instanceof Int32Array) || (typeof Uint32Array !== 'undefined' && c.input instanceof Uint32Array) || (typeof Float32Array !== 'undefined' && c.input instanceof Float32Array) || (typeof Float64Array !== 'undefined' && c.input instanceof Float64Array)) {
                    c.input = new Uint8Array(c.input.buffer, c.input.byteOffset, c.input.byteLength);
                }
            }
            try {
                c.input = inputConverter(c.input);
            } catch(err) {
                return failWithoutRequest(c.cb, err);
            }
        }

        try {
            validateInputHeaders(c.inputHeaders);
        } catch(err) {
            return failWithoutRequest(c.cb, err);
        }
        /*************** COMMON initialize helper variables **************/
        var downloaded;
        c.initDownload = function(total) {
            if(typeof c.outputLength !== 'undefined') {
                return;
            }
            c.outputLength = total;

            downloadProgressCb(downloaded, c.outputLength);
        };
        c.updateDownload = function(value) {
            if(value === downloaded) {
                return;
            }
            downloaded = value;

            downloadProgressCb(downloaded, c.outputLength);
        };
        c.noData = function() {
            c.initDownload(0);
            if(c.cb === null) {
                return;
            }
            c.cb(null, c._undefined, c.status, c.outputHeaders);
            c.cb = null;
        };
        return c;
    };
    return {
        isArrayBufferView: isArrayBufferView,
        failWithoutRequest: failWithoutRequest,
        initialize: initialize,
        noop: noop
    };
};
;common = common(window);
    var isNonEmptyString = function(str) {
        return typeof str === 'string' && str !== '';
    };
    var statusTextToCode = {
        'Continue': 100,
        'Switching Protocols': 101,
        'OK': 200,
        'Created': 201,
        'Accepted': 202,
        'Non-Authoritative Information': 203,
        'No Content': 204,
        'Reset Content': 205,
        'Partial Content': 206,
        'Multiple Choices': 300,
        'Moved Permanently': 301,
        'Found': 302,
        'See Other': 303,
        'Not Modified': 304,
        'Use Proxy': 305,
        'Temporary Redirect': 307,
        'Bad Request': 400,
        'Unauthorized': 401,
        'Payment Required': 402,
        'Forbidden': 403,
        'Not Found': 404,
        'Method Not Allowed': 405,
        'Not Acceptable': 406,
        'Proxy Authentication Required': 407,
        'Request Timeout': 408,
        'Conflict': 409,
        'Gone': 410,
        'Length Required': 411,
        'Precondition Failed': 412,
        'Request Entity Too Large': 413,
        'Request-URI Too Long': 414,
        'Unsupported Media Type': 415,
        'Requested Range Not Satisfiable': 416,
        'Expectation Failed': 417,
        'Internal Server Error': 500,
        'Not Implemented': 501,
        'Bad Gateway': 502,
        'Service Unavailable': 503,
        'Gateway Time-out': 504,
        'HTTP Version Not Supported': 505
    };
    var bufferSlice = function(buffer, begin, end) {
        if(begin === 0 && end === buffer.byteLength) {
            return buffer;
        }
        if(typeof buffer.slice === 'undefined') {
            return new Uint8Array(Array.prototype.slice.call(new Uint8Array(buffer), begin, end)).buffer;
        } else {
            return buffer.slice(begin, end);
        }
    };
    var responseBodyToBytes, responseBodyLength;
    (function() {
        try {
            var vbscript = '';
            vbscript += 'Function httpinvoke_BinaryExtract(Binary, Array)\r\n';
            vbscript += '    Dim len, i\r\n';
            vbscript += '    len = LenB(Binary)\r\n';
            vbscript += '    For i = 1 to len\r\n';
            vbscript += '        Array.push(AscB(MidB(Binary, i, 1)))\r\n';
            vbscript += '    Next\r\n';
            vbscript += 'End Function\r\n';
            vbscript += '\r\n';
            vbscript += 'Function httpinvoke_BinaryLength(Binary)\r\n';
            vbscript += '    httpinvoke_BinaryLength = LenB(Binary)\r\n';
            vbscript += 'End Function\r\n';
            vbscript += '\r\n';
            window.execScript(vbscript, 'vbscript');

            var byteMapping = {};
            for(var i = 0; i < 256; i += 1) {
                for (var j = 0; j < 256; j += 1) {
                    byteMapping[String.fromCharCode(i + j * 256)] = String.fromCharCode(i) + String.fromCharCode(j);
                }
            }
            responseBodyToBytes = function(binary) {
                var bytes = [];
                window.httpinvoke_BinaryExtract(binary, bytes);
                return bytes;
            };
            responseBodyLength = function(binary) {
                return window.httpinvoke_BinaryLength(binary);
            };
        } catch(err) {
        }
    })();
    var getOutput = {
        'text' : function(xhr) {
            if(typeof xhr.response !== 'undefined') {
                return xhr.response;
            }
            return xhr.responseText;
        },
        'bytearray' : function(xhr) {
            if(typeof xhr.response !== 'undefined') {
                return new Uint8Array(xhr.response === null ? [] : xhr.response);
            }
            if(typeof xhr.responseBody !== 'undefined') {
                return responseBodyToBytes(xhr.responseBody);
            }
            var str = xhr.responseText, n = str.length, bytearray = new Array(n);
            for(var i = 0; i < n; i += 1) {
                bytearray[i] = str.charCodeAt(i) & 0xFF;
            }
            if(typeof Uint8Array !== 'undefined') {
                // firefox 4 supports typed arrays but not xhr2
                return new Uint8Array(bytearray);
            }
            return bytearray;
        }
    };
    var getOutputLength = {
        'text': function(xhr) {
            return countStringBytes(getOutput.text(xhr));
        },
        'bytearray': function(xhr) {
            if(typeof xhr.response !== 'undefined') {
                return xhr.response === null ? 0 : xhr.response.byteLength;
            }
            if(typeof xhr.responseBody !== 'undefined') {
                return responseBodyLength(xhr.responseBody);
            }
            return xhr.responseText.length;
        }
    };

    var trim = typeof ''.trim === 'undefined' ? function(string) {
        return string.replace(/^\s+|\s+$/g,'');
    } : function(string) {
        return string.trim();
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

    var parseHeader = function(header) {
        var colon = header.indexOf(':');
        return {
            name: header.slice(0, colon).toLowerCase(),
            value: trim(header.slice(colon + 1))
        };
    };

    var fillOutputHeaders = function(xhr, headers, outputHeaders) {
        var headers = xhr.getAllResponseHeaders().split(/\r?\n/);
        var i = headers.length - 1;
        var header;
        var responseHeaders = false;
        while(i >= 0) {
            header = trim(headers[i]);
            if(header.length > 0) {
                header = parseHeader(header);
                outputHeaders[header.name] = header.value;
                responseHeaders = true;
            }
            i -= 1;
        }
        return responseHeaders;
    };

    var urlPartitioningRegExp = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/;
    var isCrossDomain = function(location, uri) {
        uri = urlPartitioningRegExp.exec(uri.toLowerCase());
        location = urlPartitioningRegExp.exec(location.toLowerCase()) || [];
        return !!(uri && (uri[1] !== location[1] || uri[2] !== location[2] || (uri[3] || (uri[1] === 'http:' ? '80' : '443')) !== (location[3] || (location[1] === 'http:' ? '80' : '443'))));
    };
    var createXHR;
    var httpinvoke = function() {
        var c = common.initialize.apply(null, arguments);
        if(typeof c === 'function') {
            return c;
        }
        /*************** initialize helper variables **************/
        var uploadProgressCbCalled = false;
        var uploadProgress = function(uploaded) {
            if(c.uploadProgressCb === null) {
                return;
            }
            if(!uploadProgressCbCalled) {
                uploadProgressCbCalled = true;
                c.uploadProgressCb(0, c.inputLength);
            }
            c.uploadProgressCb(uploaded, c.inputLength);
            if(uploaded === c.inputLength) {
                c.uploadProgressCb = null;
            }
        };
        var output;
        var i;
        var currentLocation;
        try {
            // IE may throw an exception when accessing
            // a field from window.location if document.domain has been set
            currentLocation = window.location.href;
        } catch(_) {
            // Use the href attribute of an A element
            // since IE will modify it given document.location
            currentLocation = window.document.createElement('a');
            currentLocation.href = '';
            currentLocation = currentLocation.href;
        }
        var crossDomain = isCrossDomain(currentLocation, c.uri);
        /*************** start XHR **************/
        if(c.inputType === 'bytearray' && httpinvoke.requestTextOnly) {
            return common.failWithoutRequest(c.cb, new Error('bytearray inputType is not supported on this platform, please always test using requestTextOnly feature flag'));
        }
        if(crossDomain && !httpinvoke.cors) {
            return common.failWithoutRequest(c.cb, new Error('Cross-origin requests are not supported'));
        }
        if(crossDomain && c.method === 'DELETE' && !httpinvoke.corsDELETE) {
            return common.failWithoutRequest(c.cb, new Error('DELETE method in cross-origin requests is not supported in this browser'));
        }
        if(crossDomain && c.method === 'PUT' && !httpinvoke.corsPUT) {
            return common.failWithoutRequest(c.cb, new Error('PUT method in cross-origin requests is not supported in this browser'));
        }
        if(crossDomain && c.method === 'HEAD' && !httpinvoke.corsHEAD) {
            return common.failWithoutRequest(c.cb, new Error('HEAD method in cross-origin requests is not supported in this browser'));
        }
        var xhr = createXHR(crossDomain);
        xhr.open(c.method, c.uri, true);
        if(c.timeout > 0) {
            if(typeof xhr.timeout === 'undefined') {
                setTimeout(function() {
                    c.cb(new Error('download timeout'));
                    c.cb = null;
                }, c.timeout);
            } else {
                xhr.timeout = c.timeout;
            }
        }
        if(c.corsCredentials && httpinvoke.corsCredentials && typeof xhr.withCredentials === 'boolean') {
            xhr.withCredentials = true;
        }
        if(crossDomain) {
            // on some Android devices CORS implementations are buggy
            // that is why there needs to be two workarounds:
            // 1. custom header with origin has to be passed, because they do not send Origin header on the actual request
            // 2. caching must be avoided, because of unknown reasons
            // read more: http://www.kinvey.com/blog/107/how-to-build-a-service-that-supports-every-android-browser

            // workaraound for #1: sending origin in custom header, also see the server-side part of the workaround in dummyserver.js
            c.inputHeaders[c.corsOriginHeader] = window.location.protocol + '//' + window.location.host;
        }

        /*************** bind XHR event listeners **************/
        var onuploadprogress = function(progressEvent) {
            if(c.cb === null) {
                return;
            }
            if(progressEvent && progressEvent.lengthComputable) {
                uploadProgress(progressEvent.loaded);
            }
        };
        if(typeof xhr.upload !== 'undefined') {
            xhr.upload.ontimeout = function(progressEvent) {
                if(c.cb === null) {
                    return;
                }
                c.cb(new Error('upload timeout'));
                c.cb = null;
            };
            xhr.upload.onerror = function(progressEvent) {
                if(c.cb === null) {
                    return;
                }
                c.cb(new Error('upload error'));
                c.cb = null;
            };
            xhr.upload.onprogress = onuploadprogress;
        } else if(typeof xhr.onuploadprogress !== 'undefined') {
            xhr.onuploadprogress = onuploadprogress;
        }

        if(typeof xhr.ontimeout !== 'undefined') {
            xhr.ontimeout = function(progressEvent) {
                //dbg('ontimeout');
                if(c.cb === null) {
                    return;
                }
                c.cb(new Error('download timeout'));
                c.cb = null;
            };
        }
        if(typeof xhr.onerror !== 'undefined') {
            xhr.onerror = function(e) {
                inspect('onerror', e);
                //dbg('onerror');
                // For 4XX and 5XX response codes Firefox 3.6 cross-origin request ends up here, but has correct statusText, but no status and headers
                onLoad();
            };
        }
        if(typeof xhr.onloadstart !== 'undefined') {
            xhr.onloadstart = function() {
                //dbg('onloadstart');
                onHeadersReceived(false);
            };
        }
        if(typeof xhr.onloadend !== 'undefined') {
            xhr.onloadend = function() {
                //dbg('onloadend');
                onHeadersReceived(false);
            };
        }
        if(typeof xhr.onprogress !== 'undefined') {
            xhr.onprogress = function(progressEvent) {
                //dbg('onprogress');
                if(c.cb === null) {
                    return;
                }
                onHeadersReceived(false);
                if(c.statusCb !== null) {
                    return;
                }
                if(typeof progressEvent !== 'undefined') {
                    // There is a bug in Chrome 10 on 206 response with Content-Range=0-4/12 - total must be 5
                    // 'total', 12, 'totalSize', 12, 'loaded', 5, 'position', 5, 'lengthComputable', true, 'status', 206
                    // console.log('total', progressEvent.total, 'totalSize', progressEvent.totalSize, 'loaded', progressEvent.loaded, 'position', progressEvent.position, 'lengthComputable', progressEvent.lengthComputable, 'status', c.status);
                    // httpinvoke does not work around this bug, because Chrome 10 is practically not used at all, as Chrome agressively auto-updates itself to latest version
                    var total = progressEvent.total || progressEvent.totalSize || 0;
                    var current = progressEvent.loaded || progressEvent.position || 0;
                    if(progressEvent.lengthComputable) {
                        c.initDownload(total);
                    }
                    if(c.cb === null) {
                        return;
                    }
                    if(current > total) {
                        // Opera 12 progress events has a bug - .loaded can be higher than .total
                        // see http://dev.opera.com/articles/view/xhr2/#comment-96081222
                        return;
                    }
                    c.updateDownload(current);
                }
            };
        }
        /*
        var inspect = function(name, obj) {
            return;
            console.log('INSPECT ----- ', name, c.uri);
            for(var i in obj) {
                try {
                    console.log(name, 'PASS', i, typeof obj[i], typeof obj[i] === 'function' ? '[code]' : obj[i]);
                } catch(_) {
                    console.log(name, 'FAIL', i);
                }
            }
        };
        var dbg = function(name) {
            console.log('DBG ----- ', name, c.uri);
            inspect('xhr', xhr);
            try {
                console.log('PASS', 'headers', xhr.getAllResponseHeaders());
            } catch(_) {
                console.log('FAIL', 'headers');
            }
            try {
                console.log('PASS', 'cache-control', xhr.getResponseHeader('Cache-Control'));
            } catch(_) {
                console.log('FAIL', 'cache-control');
            }
        };
        */
        var received = {
            success: false,
            status: false,
            entity: false,
            headers: false
        };
        var onHeadersReceived = function(lastTry) {
            if(c.cb === null) {
                return;
            }

            try {
                if(typeof xhr.status === 'number' && xhr.status > 0) {
                    received.status = true;
                }
            } catch(_) {
            }
            try {
                if(isNonEmptyString(xhr.statusText)) {
                    received.status = true;
                }
            } catch(_) {
            }
            try {
                if(isNonEmptyString(xhr.responseText)) {
                    received.entity = true;
                }
            } catch(_) {
            }
            try {
                if(isNonEmptyString(xhr.response) || (typeof xhr.response === 'object' && xhr.response !== null)) {
                    received.entity = true;
                }
            } catch(_) {
            }

            if(c.statusCb === null) {
                return;
            }

            if(received.status || received.entity || received.success || lastTry) {
                if(typeof xhr.contentType === 'string') {
                    if(xhr.contentType !== 'text/html' || xhr.responseText !== '') {
                        // When no entity body and/or no Content-Type header is sent,
                        // XDomainRequest on IE-8 defaults to text/html xhr.contentType.
                        // Also, empty string is not a valid 'text/html' entity.
                        c.outputHeaders['content-type'] = xhr.contentType;
                        received.headers = true;
                    }
                }
                for(var i = 0; i < c.exposedHeaders.length; i += 1) {
                    try {
                        var header = xhr.getResponseHeader(c.exposedHeaders[i]);
                        if(header !== null && header !== '') {
                            c.outputHeaders[c.exposedHeaders[i].toLowerCase()] = header;
                            received.headers = true;
                        }
                    } catch(err) {
                    }
                }
                try {
                    // note - on Opera 11.10 and 11.50 calling getAllResponseHeaders may introduce side effects on xhr and responses will timeout when server responds with some HTTP status codes
                    if(fillOutputHeaders(xhr, c.outputHeaders)) {
                        received.headers = true;
                    }
                } catch(err) {
                }

                if(typeof c.status === 'undefined' && (!crossDomain || httpinvoke.corsStatus)) {
                    // Sometimes on IE 9 accessing .status throws an error, but .statusText does not.
                    try {
                        if(typeof xhr.status === 'number' && xhr.status > 0) {
                            c.status = xhr.status;
                        }
                    } catch(_) {
                    }
                    if(typeof c.status === 'undefined') {
                        try {
                            if(typeof statusTextToCode[xhr.statusText] !== 'undefined') {
                                c.status = statusTextToCode[xhr.statusText];
                            }
                        } catch(_) {
                        }
                    }
                    // sometimes IE returns 1223 when it should be 204
                    if(c.status === 1223) {
                        c.status = 204;
                    }
                }
            }

            if(!lastTry && !(received.status && received.headers)) {
                return;
            }

            uploadProgress(c.inputLength);
            if(c.cb === null) {
                return;
            }

            c.statusCb(c.status, c.outputHeaders);
            c.statusCb = null;
            if(c.cb === null) {
                return;
            }

            if(c.method === 'HEAD') {
                return c.noData();
            }

            c.updateDownload(0);
            if(c.cb === null) {
                return;
            }

            if(typeof c.outputHeaders['content-length'] !== 'undefined') {
                c.initDownload(Number(c.outputHeaders['content-length']));
                if(c.cb === null) {
                    return;
                }
            }
        };
        var onLoad = function() {
            if(c.cb === null) {
                return;
            }

            onHeadersReceived(true);
            if(c.cb === null) {
                return;
            }

            if(!received.success && typeof c.status === 'undefined') {
                // 'finished in onerror and status code is undefined'
                c.cb(new Error('download error'));
                c.cb = null;
                return;
            }

            var length;
            try {
                length = getOutputLength[c.outputType](xhr);
            } catch(_) {
                return c.noData();
            }
            if(typeof c.outputLength === 'undefined') {
                c.initDownload(length);
                if(c.cb === null) {
                    return;
                }
            } else if(length !== c.outputLength) {
                // 'output length ' + c.outputLength + ' is not equal to actually received entity length ' + length
                c.cb(new Error('download error'));
                c.cb = null;
                return;
            }

            c.updateDownload(c.outputLength);
            if(c.cb === null) {
                return;
            }

            try {
                c.cb(null, !received.entity && c.outputLength === 0 && typeof c.outputHeaders['content-type'] === 'undefined' ? c._undefined : c.outputConverter(getOutput[c.outputType](xhr)), c.status, c.outputHeaders);
            } catch(err) {
                c.cb(err);
            }
            c.cb = null;
        };
        var onloadBound = false;
        if(typeof xhr.onload !== 'undefined') {
            onloadBound = true;
            xhr.onload = function() {
                received.success = true;
                //dbg('onload');
                onLoad();
            };
        }
        if(typeof xhr.onreadystatechange !== 'undefined') {
            xhr.onreadystatechange = function() {
                //dbg('onreadystatechange ' + xhr.readyState);
                if(xhr.readyState === 2) {
                    // HEADERS_RECEIVED
                    onHeadersReceived(false);
                } else if(xhr.readyState === 3) {
                    // LOADING
                    received.success = true;
                    onHeadersReceived(false);
                    if(c.statusCb !== null) {
                        return;
                    }
                    try {
                        c.updateDownload(getOutputLength[c.outputType](xhr));
                    } catch(err) {
                    }
                // Instead of 'typeof xhr.onload === "undefined"', we must use
                // onloadBound variable, because otherwise Firefox 3.5 synchronously
                // throws a "Permission denied for <> to create wrapper for
                // object of class UnnamedClass" error
                } else if(xhr.readyState === 4 && !onloadBound) {
                    // DONE
                    onLoad();
                }
            };
        }

        /*************** set XHR request headers **************/
        if(!crossDomain || httpinvoke.corsRequestHeaders) {
            for(var inputHeaderName in c.inputHeaders) {
                if(c.inputHeaders.hasOwnProperty(inputHeaderName)) {
                    xhr.setRequestHeader(inputHeaderName, c.inputHeaders[inputHeaderName]);
                }
            }
        }
        /*************** invoke XHR request process **************/
        setTimeout(function() {
            if(c.cb === null) {
                return;
            }
            if(typeof xhr.response === 'undefined') {
                try {
                    // mime type override must be done before receiving headers - at least for Safari 5.0.4
                    if(c.outputType === 'bytearray') {
                        xhr.overrideMimeType('text/plain; charset=x-user-defined');
                    } else if(c.outputType === 'text') {
                        if(c.outputHeaders['content-type'].substr(0, 'text/'.length) !== 'text/') {
                            xhr.overrideMimeType('text/plain');
                        }
                    }
                } catch(err) {
                }
            } else {
                try {
                    xhr.responseType = c.outputType === 'bytearray' ? 'arraybuffer' : 'text';
                } catch(err) {
                }
            }
            // Content-Length header is set automatically
            if(c.inputType === 'bytearray') {
                var triedSendArrayBufferView = false;
                var triedSendBlob = false;
                var triedSendBinaryString = false;

                var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
                if(Object.prototype.toString.call(c.input) === '[object Array]') {
                    if(typeof Uint8Array === 'undefined') {
                        c.input = convertByteArrayToBinaryString(c.input);
                    } else {
                        c.input = new Uint8Array(c.input);
                    }
                }
                var go = function() {
                    var reader, bb;
                    if(triedSendBlob && triedSendArrayBufferView && triedSendBinaryString) {
                        return common.failWithoutRequest(c.cb, new Error('Unable to send'));
                    }
                    if(common.isArrayBufferView(c.input)) {
                        if(triedSendArrayBufferView) {
                            if(!triedSendBinaryString) {
                                try {
                                    c.input = convertByteArrayToBinaryString(new Uint8Array(c.input));
                                } catch(_) {
                                    triedSendBinaryString = true;
                                }
                            } else if(!triedSendBlob) {
                                if(typeof BlobBuilder === 'undefined') {
                                    try {
                                        c.input = new Blob([c.input], {
                                            type: c.inputHeaders['Content-Type']
                                        });
                                    } catch(_) {
                                        triedSendBlob = true;
                                    }
                                } else {
                                    bb = new BlobBuilder();
                                    bb.append(c.input);
                                    c.input = bb.getBlob(c.inputHeaders['Content-Type']);
                                }
                            }
                        } else {
                            try {
                                c.inputLength = c.input.byteLength;
                                if(typeof window.ArrayBufferView === 'undefined') {
                                    xhr.send(bufferSlice(c.input.buffer, c.input.byteOffset, c.input.byteOffset + c.input.byteLength));
                                } else {
                                    xhr.send(c.input);
                                }
                                return;
                            } catch(_) {
                                triedSendArrayBufferView = true;
                            }
                        }
                    } else if(typeof Blob !== 'undefined' && c.input instanceof Blob) {
                        if(triedSendBlob) {
                            if(!triedSendArrayBufferView) {
                                try {
                                    reader = new FileReader();
                                    reader.onerror = function() {
                                        triedSendArrayBufferView = true;
                                        go();
                                    };
                                    reader.onload = function() {
                                        c.input = new Uint8Array(reader.result);
                                        go();
                                    };
                                    reader.readAsArrayBuffer(c.input);
                                    return;
                                } catch(_) {
                                    triedSendArrayBufferView = true;
                                }
                            } else if(!triedSendBinaryString) {
                                try {
                                    reader = new FileReader();
                                    reader.onerror = function() {
                                        triedSendBinaryString = true;
                                        go();
                                    };
                                    reader.onload = function() {
                                        c.input = reader.result;
                                        go();
                                    };
                                    reader.readAsBinaryString(c.input);
                                    return;
                                } catch(_) {
                                    triedSendBinaryString = true;
                                }
                            }
                        } else {
                            try {
                                c.inputLength = c.input.size;
                                xhr.send(c.input);
                                return;
                            } catch(_) {
                                triedSendBlob = true;
                            }
                        }
                    } else {
                        if(triedSendBinaryString) {
                            if(!triedSendArrayBufferView) {
                                try {
                                    var a = new ArrayBuffer(c.input.length);
                                    var b = new Uint8Array(a);
                                    for(var i = 0; i < c.input.length; i += 1) {
                                        b[i] = c.input[i] & 0xFF;
                                    }
                                    c.input = b;
                                } catch(_) {
                                    triedSendArrayBufferView = true;
                                }
                            } else if(!triedSendBlob) {
                                if(typeof BlobBuilder === 'undefined') {
                                    try {
                                        c.input = new Blob([c.input], {
                                            type: c.inputHeaders['Content-Type']
                                        });
                                    } catch(_) {
                                        triedSendBlob = true;
                                    }
                                } else {
                                    bb = new BlobBuilder();
                                    bb.append(c.input);
                                    c.input = bb.getBlob(c.inputHeaders['Content-Type']);
                                }
                            }
                        } else {
                            try {
                                c.inputLength = c.input.length;
                                xhr.sendAsBinary(c.input);
                                return;
                            } catch(_) {
                                triedSendBinaryString = true;
                            }
                        }
                    }
                    setTimeout(go, 0);
                };
                go();
            } else if(c.inputType === 'text') {
                c.inputLength = countStringBytes(c.input);
                xhr.send(c.input);
            } else {
                xhr.send(null);
            }
            uploadProgress(0);
        }, 0);

        /*************** return "abort" function **************/
        return function() {
            if(c.cb === null) {
                return;
            }

            // these statements are in case "abort" is called in "finished" callback
            var _cb = c.cb;
            c.cb = null;
            _cb(new Error('abort'));

            try {
                xhr.abort();
            } catch(err){
            }
        };
    };
    httpinvoke.corsResponseContentTypeOnly = false;
    httpinvoke.corsRequestHeaders = false;
    httpinvoke.corsCredentials = false;
    httpinvoke.cors = false;
    httpinvoke.corsDELETE = false;
    httpinvoke.corsHEAD = false;
    httpinvoke.corsPUT = false;
    httpinvoke.corsStatus = false;
    httpinvoke.corsResponseTextOnly = false;
    httpinvoke.requestTextOnly = false;
    (function() {
        try {
            createXHR = function() {
                return new window.XMLHttpRequest();
            };
            var tmpxhr = createXHR();
            httpinvoke.requestTextOnly = typeof Uint8Array === 'undefined' && typeof tmpxhr.sendAsBinary === 'undefined';
            httpinvoke.cors = 'withCredentials' in tmpxhr;
            if(!httpinvoke.cors) {
                throw '';
            }
            httpinvoke.corsRequestHeaders = true;
            httpinvoke.corsCredentials = true;
            httpinvoke.corsDELETE = true;
            httpinvoke.corsPUT = true;
            httpinvoke.corsHEAD = true;
            httpinvoke.corsStatus = true;
            return;
        } catch(err) {
        }
        try {
            if(typeof XDomainRequest === 'undefined') {
                createXHR = function() {
                    return new window.XMLHttpRequest();
                };
                createXHR();
            } else {
                createXHR = function(cors) {
                    return cors ? new window.XDomainRequest() : new window.XMLHttpRequest();
                };
                createXHR(true);
                httpinvoke.cors = true;
                httpinvoke.corsResponseContentTypeOnly = true;
                httpinvoke.corsResponseTextOnly = true;
            }
            return;
        } catch(err) {
        }
        try {
            createXHR();
            return;
        } catch(err) {
        }
        var candidates = ['Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.6.0', 'Msxml2.XMLHTTP.3.0', 'Msxml2.XMLHTTP'];
        var i = candidates.length - 1;
        while(i >= 0) {
            try {
                createXHR = function() {
                    return new window.ActiveXObject(candidates[i]);
                };
                createXHR();
                return;
            } catch(err) {
            }
            i -= 1;
        }
        createXHR = function() {
            throw new Error('Cannot construct XMLHttpRequest');
        };
    })();

    return httpinvoke;
}));
;
}
