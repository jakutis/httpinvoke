var common = function(global) {
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
