(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.httpinvoke = factory();
  }
}(this, function () {
    var global;
    ;global = window;;var isArrayBufferView = function(input) {
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
            global.execScript(vbscript, 'vbscript');

            var byteMapping = {};
            for(var i = 0; i < 256; i += 1) {
                for (var j = 0; j < 256; j += 1) {
                    byteMapping[String.fromCharCode(i + j * 256)] = String.fromCharCode(i) + String.fromCharCode(j);
                }
            }
            responseBodyToBytes = function(binary) {
                var bytes = [];
                global.httpinvoke_BinaryExtract(binary, bytes);
                return bytes;
            };
            responseBodyLength = function(binary) {
                return global.httpinvoke_BinaryLength(binary);
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
        headers = xhr.getAllResponseHeaders().split(/\r?\n/);
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
        var uploadProgressCbCalled = false;
        var uploadProgress = function(uploaded) {
            if(uploadProgressCb === null) {
                return;
            }
            if(!uploadProgressCbCalled) {
                uploadProgressCbCalled = true;
                uploadProgressCb(0, inputLength);
            }
            uploadProgressCb(uploaded, inputLength);
            if(uploaded === inputLength) {
                uploadProgressCb = null;
            }
        };
        var output;
        var i;
        var currentLocation;
        try {
            // IE may throw an exception when accessing
            // a field from global.location if global.document.domain has been set
            currentLocation = global.location.href;
        } catch(_) {
            // Use the href attribute of an A element
            // since IE will modify it given document.location
            currentLocation = global.document.createElement('a');
            currentLocation.href = '';
            currentLocation = currentLocation.href;
        }
        var crossDomain = isCrossDomain(currentLocation, uri);
        /*************** start XHR **************/
        if(inputType === 'bytearray' && httpinvoke.requestTextOnly) {
            return failWithoutRequest(cb, new Error('bytearray inputType is not supported on this platform, please always test using requestTextOnly feature flag'));
        }
        if(crossDomain && !httpinvoke.cors) {
            return failWithoutRequest(cb, new Error('Cross-origin requests are not supported'));
        }
        if(crossDomain && method === 'DELETE' && !httpinvoke.corsDELETE) {
            return failWithoutRequest(cb, new Error('DELETE method in cross-origin requests is not supported in this browser'));
        }
        if(crossDomain && method === 'PUT' && !httpinvoke.corsPUT) {
            return failWithoutRequest(cb, new Error('PUT method in cross-origin requests is not supported in this browser'));
        }
        if(crossDomain && method === 'HEAD' && !httpinvoke.corsHEAD) {
            return failWithoutRequest(cb, new Error('HEAD method in cross-origin requests is not supported in this browser'));
        }
        var xhr = createXHR(crossDomain);
        xhr.open(method, uri, true);
        if(timeout > 0) {
            if(typeof xhr.timeout === 'undefined') {
                setTimeout(function() {
                    cb(new Error('download timeout'));
                    cb = null;
                }, timeout);
            } else {
                xhr.timeout = timeout;
            }
        }
        if(corsCredentials && httpinvoke.corsCredentials && typeof xhr.withCredentials === 'boolean') {
            xhr.withCredentials = true;
        }
        if(crossDomain) {
            // on some Android devices CORS implementations are buggy
            // that is why there needs to be two workarounds:
            // 1. custom header with origin has to be passed, because they do not send Origin header on the actual request
            // 2. caching must be avoided, because of unknown reasons
            // read more: http://www.kinvey.com/blog/107/how-to-build-a-service-that-supports-every-android-browser

            // workaraound for #1: sending origin in custom header, also see the server-side part of the workaround in dummyserver.js
            inputHeaders[corsOriginHeader] = global.location.protocol + '//' + global.location.host;
        }

        /*************** bind XHR event listeners **************/
        var onuploadprogress = function(progressEvent) {
            if(cb === null) {
                return;
            }
            if(progressEvent && progressEvent.lengthComputable) {
                uploadProgress(progressEvent.loaded);
            }
        };
        if(typeof xhr.upload !== 'undefined') {
            xhr.upload.ontimeout = function(progressEvent) {
                if(cb === null) {
                    return;
                }
                cb(new Error('upload timeout'));
                cb = null;
            };
            xhr.upload.onerror = function(progressEvent) {
                if(cb === null) {
                    return;
                }
                cb(new Error('upload error'));
                cb = null;
            };
            xhr.upload.onprogress = onuploadprogress;
        } else if(typeof xhr.onuploadprogress !== 'undefined') {
            xhr.onuploadprogress = onuploadprogress;
        }

        if(typeof xhr.ontimeout !== 'undefined') {
            xhr.ontimeout = function(progressEvent) {
                //dbg('ontimeout');
                if(cb === null) {
                    return;
                }
                cb(new Error('download timeout'));
                cb = null;
            };
        }
        if(typeof xhr.onerror !== 'undefined') {
            xhr.onerror = function(e) {
                //inspect('onerror', e);
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
                if(cb === null) {
                    return;
                }
                onHeadersReceived(false);
                if(statusCb !== null) {
                    return;
                }
                if(typeof progressEvent !== 'undefined') {
                    // There is a bug in Chrome 10 on 206 response with Content-Range=0-4/12 - total must be 5
                    // 'total', 12, 'totalSize', 12, 'loaded', 5, 'position', 5, 'lengthComputable', true, 'status', 206
                    // console.log('total', progressEvent.total, 'totalSize', progressEvent.totalSize, 'loaded', progressEvent.loaded, 'position', progressEvent.position, 'lengthComputable', progressEvent.lengthComputable, 'status', status);
                    // httpinvoke does not work around this bug, because Chrome 10 is practically not used at all, as Chrome agressively auto-updates itself to latest version
                    var total = progressEvent.total || progressEvent.totalSize || 0;
                    var current = progressEvent.loaded || progressEvent.position || 0;
                    if(progressEvent.lengthComputable) {
                        initDownload(total);
                    }
                    if(cb === null) {
                        return;
                    }
                    if(current > total) {
                        // Opera 12 progress events has a bug - .loaded can be higher than .total
                        // see http://dev.opera.com/articles/view/xhr2/#comment-96081222
                        return;
                    }
                    updateDownload(current);
                }
            };
        }
        /*
        var inspect = function(name, obj) {
            return;
            console.log('INSPECT ----- ', name, uri);
            for(var i in obj) {
                try {
                    console.log(name, 'PASS', i, typeof obj[i], typeof obj[i] === 'function' ? '[code]' : obj[i]);
                } catch(_) {
                    console.log(name, 'FAIL', i);
                }
            }
        };
        var dbg = function(name) {
            console.log('DBG ----- ', name, uri);
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
            if(cb === null) {
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

            if(statusCb === null) {
                return;
            }

            if(received.status || received.entity || received.success || lastTry) {
                if(typeof xhr.contentType === 'string') {
                    if(xhr.contentType !== 'text/html' || xhr.responseText !== '') {
                        // When no entity body and/or no Content-Type header is sent,
                        // XDomainRequest on IE-8 defaults to text/html xhr.contentType.
                        // Also, empty string is not a valid 'text/html' entity.
                        outputHeaders['content-type'] = xhr.contentType;
                        received.headers = true;
                    }
                }
                for(var i = 0; i < exposedHeaders.length; i += 1) {
                    try {
                        var header = xhr.getResponseHeader(exposedHeaders[i]);
                        if(header !== null && header !== '') {
                            outputHeaders[exposedHeaders[i].toLowerCase()] = header;
                            received.headers = true;
                        }
                    } catch(err) {
                    }
                }
                try {
                    // note - on Opera 11.10 and 11.50 calling getAllResponseHeaders may introduce side effects on xhr and responses will timeout when server responds with some HTTP status codes
                    if(fillOutputHeaders(xhr, outputHeaders)) {
                        received.headers = true;
                    }
                } catch(err) {
                }

                if(typeof status === 'undefined' && (!crossDomain || httpinvoke.corsStatus)) {
                    // Sometimes on IE 9 accessing .status throws an error, but .statusText does not.
                    try {
                        if(typeof xhr.status === 'number' && xhr.status > 0) {
                            status = xhr.status;
                        }
                    } catch(_) {
                    }
                    if(typeof status === 'undefined') {
                        try {
                            if(typeof statusTextToCode[xhr.statusText] !== 'undefined') {
                                status = statusTextToCode[xhr.statusText];
                            }
                        } catch(_) {
                        }
                    }
                    // sometimes IE returns 1223 when it should be 204
                    if(status === 1223) {
                        status = 204;
                    }
                }
            }

            if(!lastTry && !(received.status && received.headers)) {
                return;
            }

            uploadProgress(inputLength);
            if(cb === null) {
                return;
            }

            statusCb(status, outputHeaders);
            statusCb = null;
            if(cb === null) {
                return;
            }

            if(method === 'HEAD') {
                return noData();
            }

            updateDownload(0);
            if(cb === null) {
                return;
            }

            if(typeof outputHeaders['content-length'] !== 'undefined') {
                initDownload(Number(outputHeaders['content-length']));
                if(cb === null) {
                    return;
                }
            }
        };
        var onLoad = function() {
            if(cb === null) {
                return;
            }

            onHeadersReceived(true);
            if(cb === null) {
                return;
            }

            if(!received.success && typeof status === 'undefined') {
                // 'finished in onerror and status code is undefined'
                cb(new Error('download error'));
                cb = null;
                return;
            }

            var length;
            try {
                length = getOutputLength[outputType](xhr);
            } catch(_) {
                return noData();
            }
            if(typeof outputLength === 'undefined') {
                initDownload(length);
                if(cb === null) {
                    return;
                }
            } else if(length !== outputLength) {
                // 'output length ' + outputLength + ' is not equal to actually received entity length ' + length
                cb(new Error('download error'));
                cb = null;
                return;
            }

            updateDownload(outputLength);
            if(cb === null) {
                return;
            }

            try {
                cb(null, !received.entity && outputLength === 0 && typeof outputHeaders['content-type'] === 'undefined' ? _undefined : outputConverter(getOutput[outputType](xhr)), status, outputHeaders);
            } catch(err) {
                cb(err);
            }
            cb = null;
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
                    if(statusCb !== null) {
                        return;
                    }
                    try {
                        updateDownload(getOutputLength[outputType](xhr));
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
            for(var inputHeaderName in inputHeaders) {
                if(inputHeaders.hasOwnProperty(inputHeaderName)) {
                    try {
                        xhr.setRequestHeader(inputHeaderName, inputHeaders[inputHeaderName]);
                    } catch(err) {
                        return failWithoutRequest(cb, err);
                    }
                }
            }
        }
        /*************** invoke XHR request process **************/
        setTimeout(function() {
            if(cb === null) {
                return;
            }
            if(typeof xhr.response === 'undefined') {
                try {
                    // mime type override must be done before receiving headers - at least for Safari 5.0.4
                    if(outputType === 'bytearray') {
                        xhr.overrideMimeType('text/plain; charset=x-user-defined');
                    } else if(outputType === 'text') {
                        if(outputHeaders['content-type'].substr(0, 'text/'.length) !== 'text/') {
                            xhr.overrideMimeType('text/plain');
                        }
                    }
                } catch(err) {
                }
            } else {
                try {
                    xhr.responseType = outputType === 'bytearray' ? 'arraybuffer' : 'text';
                } catch(err) {
                }
            }
            // Content-Length header is set automatically
            if(inputType === 'bytearray') {
                var triedSendArrayBufferView = false;
                var triedSendBlob = false;
                var triedSendBinaryString = false;

                var BlobBuilder = global.BlobBuilder || global.WebKitBlobBuilder || global.MozBlobBuilder || global.MSBlobBuilder;
                if(Object.prototype.toString.call(input) === '[object Array]') {
                    if(typeof Uint8Array === 'undefined') {
                        input = convertByteArrayToBinaryString(input);
                    } else {
                        input = new Uint8Array(input);
                    }
                }
                var go = function() {
                    var reader, bb;
                    if(triedSendBlob && triedSendArrayBufferView && triedSendBinaryString) {
                        return failWithoutRequest(cb, new Error('Unable to send'));
                    }
                    if(isArrayBufferView(input)) {
                        if(triedSendArrayBufferView) {
                            if(!triedSendBinaryString) {
                                try {
                                    input = convertByteArrayToBinaryString(new Uint8Array(input));
                                } catch(_) {
                                    triedSendBinaryString = true;
                                }
                            } else if(!triedSendBlob) {
                                if(typeof BlobBuilder === 'undefined') {
                                    try {
                                        input = new global.Blob([input], {
                                            type: inputHeaders['Content-Type']
                                        });
                                    } catch(_) {
                                        triedSendBlob = true;
                                    }
                                } else {
                                    bb = new BlobBuilder();
                                    bb.append(input);
                                    input = bb.getBlob(inputHeaders['Content-Type']);
                                }
                            }
                        } else {
                            try {
                                inputLength = input.byteLength;
                                if(typeof global.ArrayBufferView === 'undefined') {
                                    xhr.send(bufferSlice(input.buffer, input.byteOffset, input.byteOffset + input.byteLength));
                                } else {
                                    xhr.send(input);
                                }
                                return;
                            } catch(_) {
                                triedSendArrayBufferView = true;
                            }
                        }
                    } else if(typeof global.Blob !== 'undefined' && input instanceof global.Blob) {
                        if(triedSendBlob) {
                            if(!triedSendArrayBufferView) {
                                try {
                                    reader = new global.FileReader();
                                    reader.onerror = function() {
                                        triedSendArrayBufferView = true;
                                        go();
                                    };
                                    reader.onload = function() {
                                        input = new Uint8Array(reader.result);
                                        go();
                                    };
                                    reader.readAsArrayBuffer(input);
                                    return;
                                } catch(_) {
                                    triedSendArrayBufferView = true;
                                }
                            } else if(!triedSendBinaryString) {
                                try {
                                    reader = new global.FileReader();
                                    reader.onerror = function() {
                                        triedSendBinaryString = true;
                                        go();
                                    };
                                    reader.onload = function() {
                                        input = reader.result;
                                        go();
                                    };
                                    reader.readAsBinaryString(input);
                                    return;
                                } catch(_) {
                                    triedSendBinaryString = true;
                                }
                            }
                        } else {
                            try {
                                inputLength = input.size;
                                xhr.send(input);
                                return;
                            } catch(_) {
                                triedSendBlob = true;
                            }
                        }
                    } else {
                        if(triedSendBinaryString) {
                            if(!triedSendArrayBufferView) {
                                try {
                                    var a = new ArrayBuffer(input.length);
                                    var b = new Uint8Array(a);
                                    for(var i = 0; i < input.length; i += 1) {
                                        b[i] = input[i] & 0xFF;
                                    }
                                    input = b;
                                } catch(_) {
                                    triedSendArrayBufferView = true;
                                }
                            } else if(!triedSendBlob) {
                                if(typeof BlobBuilder === 'undefined') {
                                    try {
                                        input = new global.Blob([input], {
                                            type: inputHeaders['Content-Type']
                                        });
                                    } catch(_) {
                                        triedSendBlob = true;
                                    }
                                } else {
                                    bb = new BlobBuilder();
                                    bb.append(input);
                                    input = bb.getBlob(inputHeaders['Content-Type']);
                                }
                            }
                        } else {
                            try {
                                inputLength = input.length;
                                xhr.sendAsBinary(input);
                                return;
                            } catch(_) {
                                triedSendBinaryString = true;
                            }
                        }
                    }
                    setTimeout(go, 0);
                };
                go();
            } else if(inputType === 'text') {
                inputLength = countStringBytes(input);
                xhr.send(input);
            } else {
                xhr.send(null);
            }
            uploadProgress(0);
        }, 0);

        /*************** return "abort" function **************/
        return function() {
            if(cb === null) {
                return;
            }

            // these statements are in case "abort" is called in "finished" callback
            var _cb = cb;
            cb = null;
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
                return new global.XMLHttpRequest();
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
                    return new global.XMLHttpRequest();
                };
                createXHR();
            } else {
                createXHR = function(cors) {
                    return cors ? new global.XDomainRequest() : new global.XMLHttpRequest();
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
                    return new global.ActiveXObject(candidates[i]);
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
