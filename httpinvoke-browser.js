(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.httpinvoke = factory();
  }
}(this, /* jshint -W030 */
/* jshint -W033 */
/* jshint -W068 */
(function() {
/* jshint +W030 */
/* jshint +W033 */
/* jshint +W068 */
    'use strict';
    var global;
    /* jshint unused:true */
    ;global = window;;var resolve = 0, reject = 1, progress = 2, chain = function(a, b) {
    /* jshint expr:true */
    if(a && a.then) {
        a.then(function() {
            b[resolve].apply(null, arguments);
        }, function() {
            b[reject].apply(null, arguments);
        }, function() {
            b[progress].apply(null, arguments);
        });
    } else {
        b[resolve](a);
    }
    /* jshint expr:false */
}, nextTick = (global.process && global.process.nextTick) || global.setImmediate || global.setTimeout, mixInPromise = function(o) {
    var value, queue = [], state = progress;
    var makeState = function(newstate) {
        o[newstate] = function() {
            var i, p;
            if(queue) {
                value = [].slice.call(arguments);
                state = newstate;

                for(i = 0; i < queue.length; i += 1) {
                    if(typeof queue[i][state] === 'function') {
                        try {
                            p = queue[i][state].apply(null, value);
                            if(state < progress) {
                                chain(p, queue[i]._);
                            }
                        } catch(err) {
                            queue[i]._[reject](err);
                        }
                    } else if(state < progress) {
                        queue[i]._[state].apply(null, value);
                    }
                }
                if(state < progress) {
                    queue = null;
                }
            }
        };
    };
    makeState(progress);
    makeState(resolve);
    makeState(reject);
    o.then = function() {
        var item = [].slice.call(arguments);
        item._ = mixInPromise({});
        if(queue) {
            queue.push(item);
        } else if(typeof item[state] === 'function') {
            nextTick(function() {
                chain(item[state].apply(null, value), item._);
            });
        }
        return item._;
    };
    return o;
}, isArrayBufferView = /* jshint undef:false */function(input) {
    return typeof input === 'object' && input !== null && (
        (global.ArrayBufferView && input instanceof ArrayBufferView) ||
        (global.Int8Array && input instanceof Int8Array) ||
        (global.Uint8Array && input instanceof Uint8Array) ||
        (global.Uint8ClampedArray && input instanceof Uint8ClampedArray) ||
        (global.Int16Array && input instanceof Int16Array) ||
        (global.Uint16Array && input instanceof Uint16Array) ||
        (global.Int32Array && input instanceof Int32Array) ||
        (global.Uint32Array && input instanceof Uint32Array) ||
        (global.Float32Array && input instanceof Float32Array) ||
        (global.Float64Array && input instanceof Float64Array)
    );
}/* jshint undef:true */, isArray = function(object) {
    return Object.prototype.toString.call(object) === '[object Array]';
}, isFormData = function(input) {
    return typeof input === 'object' && input !== null && global.FormData &&
        input instanceof global.FormData;
}, isByteArray = /* jshint undef:false */function(input) {
    return typeof input === 'object' && input !== null && (
        (global.Buffer && input instanceof Buffer) ||
        (global.Blob && input instanceof Blob) ||
        (global.File && input instanceof File) ||
        (global.ArrayBuffer && input instanceof ArrayBuffer) ||
        isArrayBufferView(input) ||
        isArray(input)
    );
}/* jshint undef:true */, supportedMethods = ',GET,HEAD,PATCH,POST,PUT,DELETE,', pass = function(value) {
    return value;
}, _undefined, absoluteURLRegExp = /^[a-z][a-z0-9.+-]*:/i, addHook = function(type, hook) {
    'use strict';
    if(typeof hook !== 'function') {
        throw new Error('TODO error');
    }
    if(!this._hooks[type]) {
        throw new Error('TODO error');
    }
    var httpinvoke = build();
    for(var i in this._hooks) {
        if(this._hooks.hasOwnProperty(i)) {
            httpinvoke._hooks[i].push.apply(httpinvoke._hooks[i], this._hooks[i]);
        }
    }
    httpinvoke._hooks[type].push(hook);
    return httpinvoke;
}, initHooks = function() {
    return {
        finished:[],
        downloading:[],
        uploading:[],
        gotStatus:[]
    };
};
;
    /* jshint unused:false */
    // this could be a simple map, but with this "compression" we save about 100 bytes, if minified (50 bytes, if also gzipped)
    var statusTextToCode = (function() {
        for(var group = arguments.length, map = {};group--;) {
            for(var texts = arguments[group].split(','), index = texts.length;index--;) {
                map[texts[index]] = (group + 1) * 100 + index;
            }
        }
        return map;
    })(
        'Continue,Switching Protocols',
        'OK,Created,Accepted,Non-Authoritative Information,No Content,Reset Content,Partial Content',
        'Multiple Choices,Moved Permanently,Found,See Other,Not Modified,Use Proxy,_,Temporary Redirect',
        'Bad Request,Unauthorized,Payment Required,Forbidden,Not Found,Method Not Allowed,Not Acceptable,Proxy Authentication Required,Request Timeout,Conflict,Gone,Length Required,Precondition Failed,Request Entity Too Large,Request-URI Too Long,Unsupported Media Type,Requested Range Not Satisfiable,Expectation Failed',
        'Internal Server Error,Not Implemented,Bad Gateway,Service Unavailable,Gateway Time-out,HTTP Version Not Supported'
    );
    var upgradeByteArray = global.Uint8Array ? function(array) {
        return new Uint8Array(array);
    } : pass;
    var binaryStringToByteArray = function(str, bytearray) {
        for(var i = bytearray.length; i < str.length;) {
            /* jshint bitwise:false */
            bytearray.push(str.charCodeAt(i++) & 255);
            /* jshint bitwise:true */
        }
        return bytearray;
    };
    var countStringBytes = function(string) {
        for(var c, n = 0, i = string.length;i--;) {
            c = string.charCodeAt(i);
            n += c < 128 ? 1 : (c < 2048 ? 2 : 3);
        }
        return n;
    };
    var responseBodyToBytes, responseBodyLength;
    try {
        /* jshint evil:true */
        execScript('Function httpinvoke0(B,A,C)\r\nDim i\r\nFor i=C to LenB(B)\r\nA.push(AscB(MidB(B,i,1)))\r\nNext\r\nEnd Function\r\nFunction httpinvoke1(B)\r\nhttpinvoke1=LenB(B)\r\nEnd Function', 'vbscript');
        /* jshint evil:false */
        responseBodyToBytes = function(binary, bytearray) {
            // that vbscript counts from 1, not from 0
            httpinvoke0(binary, bytearray, bytearray.length + 1);
            return bytearray;
        };
        // cannot just assign the function, because httpinvoke1 is not a javascript 'function'
        responseBodyLength = function(binary) {
            return httpinvoke1(binary);
        };
    } catch(err) {
    }
    var responseByteArray = function(xhr, bytearray) {
        // If response body has bytes out of printable ascii character range, then
        // accessing xhr.responseText on Internet Explorer throws "Could not complete the operation due to error c00ce514".
        // Therefore, try getting the bytearray from xhr.responseBody.
        // Also responseBodyToBytes on some Internet Explorers is not defined, because of removed vbscript support.
        return 'responseBody' in xhr && responseBodyToBytes ? responseBodyToBytes(xhr.responseBody, bytearray) : binaryStringToByteArray(xhr.responseText, bytearray);
    };
    var responseByteArrayLength = function(xhr) {
        return 'responseBody' in xhr && responseBodyLength ? responseBodyLength(xhr.responseBody) : xhr.responseText.length;
    };
    var fillOutputHeaders = function(xhr, outputHeaders) {
        var headers = xhr.getAllResponseHeaders().split(/\r?\n/);
        var atLeastOne = false;
        for(var i = headers.length, colon, header; i--;) {
            if((colon = headers[i].indexOf(':')) >= 0) {
                outputHeaders[headers[i].substr(0, colon).toLowerCase()] = headers[i].substr(colon + 2);
                atLeastOne = true;
            }
        }
        return atLeastOne;
    };

    var urlPartitioningRegExp = /^(?:([a-z][a-z0-9.+-]*:)|)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/;
    var isCrossDomain = function(location, url) {
        if(!absoluteURLRegExp.test(url) && url.substr(0, 2) !== '//') {
            return false;
        }
        url = urlPartitioningRegExp.exec(url.toLowerCase());
        location = urlPartitioningRegExp.exec(location.toLowerCase()) || [];
        var locationPort = location[3] || (location[1] === 'http:' ? '80' : '443');
        return !!((url[1] && url[1] !== location[1]) || url[2] !== location[2] || (url[3] || (url[1] ? (url[1] === 'http:' ? '80' : '443') : locationPort)) !== locationPort);
    };

var build = function() {
    var createXHR;
    var httpinvoke = function(url, method, options, cb) {
        /* jshint unused:true */
        ;/* global httpinvoke, url, method, options, cb */
/* global nextTick, mixInPromise, pass, progress, reject, resolve, supportedMethods, isArray, isArrayBufferView, isFormData, isByteArray, _undefined, absoluteURLRegExp */
/* global setTimeout */
/* global crossDomain */// this one is a hack, because when in nodejs this is not really defined, but it is never needed
/* jshint -W020 */
var hook, promise, failWithoutRequest, uploadProgressCb, downloadProgressCb, inputLength, inputHeaders, statusCb, outputHeaders, exposedHeaders, status, outputBinary, input, outputLength, outputConverter, protocol, anonymous, system;
hook = function(type, args) {
    var hooks = httpinvoke._hooks[type];
    for(var i = 0; i < hooks.length; i += 1) {
        args = hooks[i].apply(null, args);
    }
    return args;
};
/*************** COMMON initialize parameters **************/
var downloadTimeout, uploadTimeout, timeout;
if(!method) {
    // 1 argument
    // method, options, cb skipped
    method = 'GET';
    options = {};
} else if(!options) {
    // 2 arguments
    if(typeof method === 'string') {
        // options. cb skipped
        options = {};
    } else if(typeof method === 'object') {
        // method, cb skipped
        options = method;
        method = 'GET';
    } else {
        // method, options skipped
        options = {
            finished: method
        };
        method = 'GET';
    }
} else if(!cb) {
    // 3 arguments
    if(typeof method === 'object') {
        // method skipped
        method.finished = options;
        options = method;
        method = 'GET';
    } else if(typeof options === 'function') {
        // options skipped
        options = {
            finished: options
        };
    }
    // cb skipped
} else {
    // 4 arguments
    options.finished = cb;
}
var safeCallback = function(name, aspectBefore, aspectAfter) {
    return function() {
        var args = [], _cb, failedOnHook = false, fail = function(err, args) {
            _cb = cb;
            cb = null;
            nextTick(function() {
                /* jshint expr:true */
                _cb && _cb(err);
                /* jshint expr:false */
                promise();
                if(!_cb && !failedOnHook) {
                    throw err;
                }
            });
            return name === 'finished' ? [err] : args;
        };
        aspectBefore.apply(null, args);
        try {
            args = hook(name, [].slice.call(arguments));
        } catch(err) {
            failedOnHook = true;
            args = fail(err, args);
        }
        if(options[name]) {
            try {
                options[name].apply(null, args);
            } catch(err) {
                args = fail(err, args);
            }
        }
        aspectAfter.apply(null, args);
    };
};
failWithoutRequest = function(cb, err) {
    if(!(err instanceof Error)) {
        // create error here, instead of nextTick, to preserve stack
        err = new Error('Error code #' + err +'. See https://github.com/jakutis/httpinvoke#error-codes');
    }
    nextTick(function() {
        if(cb === null) {
            return;
        }
        cb(err);
    });
    promise = function() {
    };
    return mixInPromise(promise);
};

uploadProgressCb = safeCallback('uploading', pass, function(current, total) {
    promise[progress]({
        type: 'upload',
        current: current,
        total: total
    });
});
downloadProgressCb = safeCallback('downloading', pass, function(current, total, partial) {
    promise[progress]({
        type: 'download',
        current: current,
        total: total,
        partial: partial
    });
});
statusCb = safeCallback('gotStatus', function() {
    statusCb = null;
    if(downloadTimeout) {
        setTimeout(function() {
            if(cb) {
                cb(new Error('download timeout'));
                promise();
            }
        }, downloadTimeout);
    }
}, function(statusCode, headers) {
    promise[progress]({
        type: 'headers',
        statusCode: statusCode,
        headers: headers
    });
});
cb = safeCallback('finished', function() {
    cb = null;
    promise();
}, function(err, body, statusCode, headers) {
    var res = {
        body: body,
        statusCode: statusCode,
        headers: headers
    };
    if(err) {
        return promise[reject](err, res);
    }
    promise[resolve](res);
});
var converters = options.converters || {};
var inputConverter;
inputHeaders = (function(input) {
    var output = {};
    for(var i in input) {
        if(input.hasOwnProperty(i)) {
            output[i] = input[i];
        }
    }
    return output;
})(options.headers || {});
outputHeaders = {};
exposedHeaders = options.corsExposedHeaders || [];
exposedHeaders.push.apply(exposedHeaders, ['Cache-Control', 'Content-Language', 'Content-Type', 'Content-Length', 'Expires', 'Last-Modified', 'Pragma', 'Content-Range', 'Content-Encoding']);
/*************** COMMON convert and validate parameters **************/
var validateInputHeaders = function(headers) {
    var noSec = httpinvoke.forbiddenInputHeaders.indexOf('sec-*') >= 0;
    var noProxy = httpinvoke.forbiddenInputHeaders.indexOf('proxy-*') >= 0;
    for(var header in headers) {
        if(headers.hasOwnProperty(header)) {
            var headerl = header.toLowerCase();
            if(httpinvoke.forbiddenInputHeaders.indexOf(headerl) >= 0) {
                throw [14, header];
            }
            if(noProxy && headerl.substr(0, 'proxy-'.length) === 'proxy-') {
                throw [15, header];
            }
            if(noSec && headerl.substr(0, 'sec-'.length) === 'sec-') {
                throw [16, header];
            }
        }
    }
};
try {
    validateInputHeaders(inputHeaders);
} catch(err) {
    return failWithoutRequest(cb, err);
}
if(!httpinvoke.relativeURLs && !absoluteURLRegExp.test(url)) {
    return failWithoutRequest(cb, [26, url]);
}
protocol = url.substr(0, url.indexOf(':'));
if(absoluteURLRegExp.test(url) && protocol !== 'http' && protocol !== 'https') {
    return failWithoutRequest(cb, [25, protocol]);
}
anonymous = typeof options.anonymous === 'undefined' ? httpinvoke.anonymousByDefault : options.anonymous;
system = typeof options.system === 'undefined' ? httpinvoke.systemByDefault : options.system;
if(typeof options.system !== 'undefined' && system) {
    anonymous = true;
}
var partialOutputMode = options.partialOutputMode || 'disabled';
if(partialOutputMode.indexOf(',') >= 0 || ',disabled,chunked,joined,'.indexOf(',' + partialOutputMode + ',') < 0) {
    return failWithoutRequest(cb, [3]);
}
if(method.indexOf(',') >= 0 || !httpinvoke.anyMethod && supportedMethods.indexOf(',' + method + ',') < 0) {
    return failWithoutRequest(cb, [4, method]);
}
var optionsOutputType = options.outputType;
outputBinary = optionsOutputType === 'bytearray';
if(!optionsOutputType || optionsOutputType === 'text' || outputBinary) {
    outputConverter = pass;
} else if(converters['text ' + optionsOutputType]) {
    outputConverter = converters['text ' + optionsOutputType];
    outputBinary = false;
} else if(converters['bytearray ' + optionsOutputType]) {
    outputConverter = converters['bytearray ' + optionsOutputType];
    outputBinary = true;
} else {
    return failWithoutRequest(cb, [5, optionsOutputType]);
}
inputConverter = pass;
var optionsInputType = options.inputType;
input = options.input;
if(input !== _undefined) {
    if(!optionsInputType || optionsInputType === 'auto') {
        if(typeof input !== 'string' && !isByteArray(input) && !isFormData(input)) {
            return failWithoutRequest(cb, [6]);
        }
    } else if(optionsInputType === 'text') {
        if(typeof input !== 'string') {
            return failWithoutRequest(cb, [7]);
        }
    } else if (optionsInputType === 'formdata') {
        if(!isFormData(input)) {
            return failWithoutRequest(cb, [8]);
        }
    } else if (optionsInputType === 'bytearray') {
        if(!isByteArray(input)) {
            return failWithoutRequest(cb, [9]);
        }
    } else if(converters[optionsInputType + ' text']) {
        inputConverter = converters[optionsInputType + ' text'];
    } else if(converters[optionsInputType + ' bytearray']) {
        inputConverter = converters[optionsInputType + ' bytearray'];
    } else if(converters[optionsInputType + ' formdata']) {
        inputConverter = converters[optionsInputType + ' formdata'];
    } else {
        return failWithoutRequest(cb, [10, optionsInputType]);
    }
    if(typeof input === 'object' && !isFormData(input)) {
        if(global.ArrayBuffer && input instanceof global.ArrayBuffer) {
            input = new global.Uint8Array(input);
        } else if(isArrayBufferView(input)) {
            input = new global.Uint8Array(input.buffer, input.byteOffset, input.byteLength);
        }
    }
    try {
        input = inputConverter(input);
    } catch(err) {
        return failWithoutRequest(cb, err);
    }
} else {
    if(optionsInputType && optionsInputType !== 'auto') {
        return failWithoutRequest(cb, [11]);
    }
    if(inputHeaders['Content-Type']) {
        return failWithoutRequest(cb, [12]);
    }
}
var isValidTimeout = function(timeout) {
    return timeout > 0 && timeout < 1073741824;
};
var optionsTimeout = options.timeout;
if(optionsTimeout !== _undefined) {
    if(typeof optionsTimeout === 'number' && isValidTimeout(optionsTimeout)) {
        timeout = optionsTimeout;
    } else if(isArray(optionsTimeout) && optionsTimeout.length === 2 && isValidTimeout(optionsTimeout[0]) && isValidTimeout(optionsTimeout[1])) {
        if(httpinvoke.corsFineGrainedTimeouts || !crossDomain) {
            uploadTimeout = optionsTimeout[0];
            downloadTimeout = optionsTimeout[1];
        } else {
            timeout = optionsTimeout[0] + optionsTimeout[1];
        }
    } else {
        return failWithoutRequest(cb, [13]);
    }
}
if(uploadTimeout) {
    setTimeout(function() {
        if(statusCb) {
            cb(new Error('upload timeout'));
            promise();
        }
    }, uploadTimeout);
}
if(timeout) {
    setTimeout(function() {
        if(cb) {
            cb(new Error('timeout'));
            promise();
        }
    }, timeout);
}

;
        /* jshint unused:false */
        /*************** initialize helper variables **************/
        var xhr, i, j, currentLocation, crossDomain, output,
            uploadProgressCbCalled = false,
            partialPosition = 0,
            partialBuffer = partialOutputMode === 'disabled' ? _undefined : (outputBinary ? [] : ''),
            partial = partialBuffer,
            partialUpdate = function() {
                if(partialOutputMode === 'disabled') {
                    return;
                }
                if(outputBinary) {
                    responseByteArray(xhr, partialBuffer);
                } else {
                    partialBuffer = xhr.responseText;
                }
                partial = partialOutputMode === 'joined' ? partialBuffer : partialBuffer.slice(partialPosition);
                partialPosition = partialBuffer.length;
            };
        var uploadProgress = function(uploaded) {
            if(!uploadProgressCb) {
                return;
            }
            if(!uploadProgressCbCalled) {
                uploadProgressCbCalled = true;
                uploadProgressCb(0, inputLength);
                if(!cb) {
                    return;
                }
            }
            uploadProgressCb(uploaded, inputLength);
            if(uploaded === inputLength) {
                uploadProgressCb = null;
            }
        };
        try {
            // IE may throw an exception when accessing
            // a field from location if document.domain has been set
            currentLocation = location.href;
        } catch(_) {
            // Use the href attribute of an A element
            // since IE will modify it given document.location
            currentLocation = document.createElement('a');
            currentLocation.href = '';
            currentLocation = currentLocation.href;
        }
        crossDomain = isCrossDomain(currentLocation, url);
        /*************** start XHR **************/
        if(typeof input === 'object' && !isFormData(input) && httpinvoke.requestTextOnly) {
            return failWithoutRequest(cb, [17]);
        }
        if(crossDomain && !httpinvoke.cors) {
            return failWithoutRequest(cb, [18]);
        }
        for(j = ['DELETE', 'PATCH', 'PUT', 'HEAD'], i = j.length;i-- > 0;) {
            if(crossDomain && method === j[i] && !httpinvoke['cors' + j[i]]) {
                return failWithoutRequest(cb, [19, method]);
            }
        }
        if(method === 'PATCH' && !httpinvoke.PATCH) {
            return failWithoutRequest(cb, [20]);
        }
        if(!createXHR) {
            return failWithoutRequest(cb, [21]);
        }
        xhr = createXHR(crossDomain, {
            mozAnon: anonymous,
            mozSystem: system
        });
        try {
            xhr.open(method, url, true);
        } catch(e) {
            return failWithoutRequest(cb, [22, url]);
        }
        if(httpinvoke.corsCredentials) {
            if((typeof options.anonymous !== 'undefined' && !anonymous) || (options.corsCredentials && typeof xhr.withCredentials === 'boolean')) {
                xhr.withCredentials = true;
            }
        }
        if(crossDomain && options.corsOriginHeader) {
            // on some Android devices CORS implementations are buggy
            // that is why there needs to be two workarounds:
            // 1. custom header with origin has to be passed, because they do not send Origin header on the actual request
            // 2. caching must be avoided, because of unknown reasons
            // read more: http://www.kinvey.com/blog/107/how-to-build-a-service-that-supports-every-android-browser

            // workaraound for #1: sending origin in custom header, also see the server-side part of the workaround in dummyserver.js
            inputHeaders[options.corsOriginHeader] = location.protocol + '//' + location.host;
        }

        /*************** bind XHR event listeners **************/
        var abOrZero = function(object, propertyA, propertyB) {
            if(typeof object[propertyA] !== 'undefined') {
                return object[propertyA];
            }
            if(typeof object[propertyB] !== 'undefined') {
                return object[propertyB];
            }
            return 0;
        };
        var onuploadprogress = function(progressEvent) {
            if(cb && progressEvent.lengthComputable) {
                if(inputLength === _undefined) {
                    inputLength = abOrZero(progressEvent, 'total', 'totalSize');
                    uploadProgress(0);
                }
                uploadProgress(abOrZero(progressEvent, 'loaded', 'position'));
            }
        };
        if('upload' in xhr) {
            xhr.upload.onerror = function() {
                received.error = true;
                // must check, because some callbacks are called synchronously, thus throwing exceptions and breaking code
                /* jshint expr:true */
                cb && cb(new Error('network error'));
                /* jshint expr:false */
            };
            xhr.upload.onprogress = onuploadprogress;
        } else if('onuploadprogress' in xhr) {
            xhr.onuploadprogress = onuploadprogress;
        }

        if('onerror' in xhr) {
            xhr.onerror = function() {
                received.error = true;
                //inspect('onerror', arguments[0]);
                //dbg('onerror');
                // For 4XX and 5XX response codes Firefox 3.6 cross-origin request ends up here, but has correct statusText, but no status and headers
                onLoad();
            };
        }
        var ondownloadprogress = function(progressEvent) {
            onHeadersReceived(false);
            // There is a bug in Chrome 10 on 206 response with Content-Range=0-4/12 - total must be 5
            // 'total', 12, 'totalSize', 12, 'loaded', 5, 'position', 5, 'lengthComputable', true, 'status', 206
            // console.log('total', progressEvent.total, 'totalSize', progressEvent.totalSize, 'loaded', progressEvent.loaded, 'position', progressEvent.position, 'lengthComputable', progressEvent.lengthComputable, 'status', status);
            // httpinvoke does not work around this bug, because Chrome 10 is practically not used at all, as Chrome agressively auto-updates itself to latest version
            try {
                var current = abOrZero(progressEvent, 'loaded', 'position');
                if(progressEvent.lengthComputable) {
                    outputLength = abOrZero(progressEvent, 'total', 'totalSize');
                }

                // Opera 12 progress events has a bug - .loaded can be higher than .total
                // see http://dev.opera.com/articles/view/xhr2/#comment-96081222
                /* jshint expr:true */
                cb && current <= outputLength && !statusCb && (partialUpdate(), downloadProgressCb(current, outputLength, partial));
                /* jshint expr:false */
            } catch(_) {
            }
        };
        if('onloadstart' in xhr) {
            xhr.onloadstart = ondownloadprogress;
        }
        if('onloadend' in xhr) {
            xhr.onloadend = ondownloadprogress;
        }
        if('onprogress' in xhr) {
            xhr.onprogress = ondownloadprogress;
        }
        /*
        var inspect = function(name, obj) {
            return;
            console.log('INSPECT ----- ', name, url);
            for(var i in obj) {
                try {
                    console.log(name, 'PASS', i, typeof obj[i], typeof obj[i] === 'function' ? '[code]' : obj[i]);
                } catch(_) {
                    console.log(name, 'FAIL', i);
                }
            }
        };
        var dbg = function(name) {
            console.log('DBG ----- ', name, url);
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
        var received = {};
        var mustBeIdentity;
        var tryHeadersAndStatus = function(lastTry) {
            try {
                if(xhr.status) {
                    received.status = true;
                }
            } catch(_) {
            }
            try {
                if(xhr.statusText) {
                    received.status = true;
                }
            } catch(_) {
            }
            try {
                if(xhr.responseText) {
                    received.entity = true;
                }
            } catch(_) {
            }
            try {
                if(xhr.response) {
                    received.entity = true;
                }
            } catch(_) {
            }
            try {
                if(responseBodyLength(xhr.responseBody)) {
                    received.entity = true;
                }
            } catch(_) {
            }

            if(!statusCb) {
                return;
            }

            if(received.status || received.entity || received.success || lastTry) {
                if(typeof xhr.contentType === 'string' && xhr.contentType) {
                    if(xhr.contentType !== 'text/html' || xhr.responseText !== '') {
                        // When no entity body and/or no Content-Type header is sent,
                        // XDomainRequest on IE-8 defaults to text/html xhr.contentType.
                        // Also, empty string is not a valid 'text/html' entity.
                        outputHeaders['content-type'] = xhr.contentType;
                        received.headers = true;
                    }
                }
                for(var i = 0; i < exposedHeaders.length; i++) {
                    var header;
                    try {
                        /* jshint boss:true */
                        if(header = xhr.getResponseHeader(exposedHeaders[i])) {
                        /* jshint boss:false */
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

                mustBeIdentity = outputHeaders['content-encoding'] === 'identity' || (!crossDomain && !outputHeaders['content-encoding']);
                if(mustBeIdentity && 'content-length' in outputHeaders) {
                    outputLength = Number(outputHeaders['content-length']);
                }

                if(!status && (!crossDomain || httpinvoke.corsStatus)) {
                    // Sometimes on IE 9 accessing .status throws an error, but .statusText does not.
                    try {
                        if(xhr.status) {
                            status = xhr.status;
                        }
                    } catch(_) {
                    }
                    if(!status) {
                        try {
                            status = statusTextToCode[xhr.statusText];
                        } catch(_) {
                        }
                    }
                    // sometimes IE returns 1223 when it should be 204
                    if(status === 1223) {
                        status = 204;
                    }
                    // IE (at least version 6) returns various detailed network
                    // connection error codes (concretely - WinInet Error Codes).
                    // For references of their meaning, see http://support.microsoft.com/kb/193625
                    if(status >= 12001 && status <= 12156) {
                        status = _undefined;
                    }
                }
            }
        };
        var onHeadersReceived = function(lastTry) {
            if(!cb) {
                return;
            }

            if(!lastTry) {
                tryHeadersAndStatus(false);
            }

            if(!statusCb || (!lastTry && !(received.status && received.headers))) {
                return;
            }

            if(inputLength === _undefined) {
                inputLength = 0;
                uploadProgress(0);
            }
            uploadProgress(inputLength);
            if(!cb) {
                return;
            }

            statusCb(status, outputHeaders);
            if(!cb) {
                return;
            }

            downloadProgressCb(0, outputLength, partial);
            if(!cb) {
                return;
            }
            if(method === 'HEAD') {
                downloadProgressCb(0, 0, partial);
                return cb && cb(null, _undefined, status, outputHeaders);
            }
        };
        var onLoad = function() {
            if(!cb) {
                return;
            }

            tryHeadersAndStatus(true);

            var length;
            try {
                length =
                    partialOutputMode !== 'disabled' ?
                    responseByteArrayLength(xhr) :
                    (
                        outputBinary ?
                        (
                            'response' in xhr ?
                            (
                                xhr.response ?
                                xhr.response.byteLength :
                                0
                            ) :
                            responseByteArrayLength(xhr)
                        ) :
                        countStringBytes(xhr.responseText)
                    );
            } catch(_) {
                length = 0;
            }
            if(outputLength !== _undefined) {
                if(mustBeIdentity) {
                    if(length !== outputLength && method !== 'HEAD') {
                        return cb(new Error('network error'));
                    }
                } else {
                    if(received.error) {
                        return cb(new Error('network error'));
                    }
                }
            } else {
                outputLength = length;
            }

            var noentity = !received.entity && outputLength === 0 && outputHeaders['content-type'] === _undefined;

            if((noentity && status === 200) || (!received.success && !status && (received.error || ('onreadystatechange' in xhr && !received.readyStateLOADING)))) {
                /*
                 * Note: on Opera 10.50, TODO there is absolutely no difference
                 * between a non 2XX response and an immediate socket closing on
                 * server side - both give no headers, no status, no entity, and
                 * end up in 'onload' event. Thus some network errors will end
                 * up calling "finished" without Error.
                 */
                return cb(new Error('network error'));
            }

            onHeadersReceived(true);
            if(!cb) {
                return;
            }

            if(noentity) {
                downloadProgressCb(0, 0, partial);
                return cb(null, _undefined, status, outputHeaders);
            }

            partialUpdate();
            downloadProgressCb(outputLength, outputLength, partial);
            if(!cb) {
                return;
            }

            try {
                // If XHR2 (there is xhr.response), then there must also be Uint8Array.
                // But Uint8Array might exist even if not XHR2 (on Firefox 4).
                cb(null, outputConverter(
                    partialBuffer || (
                        outputBinary ?
                        upgradeByteArray(
                            'response' in xhr ?
                            xhr.response || [] :
                            responseByteArray(xhr, [])
                        ) :
                        xhr.responseText
                    )
                ), status, outputHeaders);
            } catch(err) {
                cb(err);
            }
        };
        var onloadBound = 'onload' in xhr;
        if(onloadBound) {
            xhr.onload = function() {
                received.success = true;
                //dbg('onload');
                onLoad();
            };
        }
        if('onreadystatechange' in xhr) {
            xhr.onreadystatechange = function() {
                //dbg('onreadystatechange ' + xhr.readyState);
                if(xhr.readyState === 2) {
                    // HEADERS_RECEIVED
                    onHeadersReceived(false);
                } else if(xhr.readyState === 3) {
                    // LOADING
                    received.readyStateLOADING = true;
                    onHeadersReceived(false);
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
                        return failWithoutRequest(cb, [23, inputHeaderName]);
                    }
                }
            }
        }
        /*************** invoke XHR request process **************/
        nextTick(function() {
            if(!cb) {
                return;
            }
            if(outputBinary) {
                try {
                    if(partialOutputMode === 'disabled' && 'response' in xhr) {
                        xhr.responseType = 'arraybuffer';
                    } else {
                        // mime type override must be done before receiving headers - at least for Safari 5.0.4
                        xhr.overrideMimeType('text/plain; charset=x-user-defined');
                    }
                } catch(_) {
                }
            }
            if(isFormData(input)) {
                try {
                    xhr.send(input);
                } catch(err) {
                    return failWithoutRequest(cb, [24]);
                }
            } else if(typeof input === 'object') {
                var triedSendArrayBufferView = false;
                var triedSendBlob = false;
                var triedSendBinaryString = false;

                var BlobBuilder = global.BlobBuilder || global.WebKitBlobBuilder || global.MozBlobBuilder || global.MSBlobBuilder;
                if(isArray(input)) {
                    input = global.Uint8Array ? new Uint8Array(input) : String.fromCharCode.apply(String, input);
                }
                var toBlob = BlobBuilder ? function() {
                    var bb = new BlobBuilder();
                    bb.append(input);
                    input = bb.getBlob(inputHeaders['Content-Type'] || 'application/octet-stream');
                } : function() {
                    try {
                        input = new Blob([input], {
                            type: inputHeaders['Content-Type'] || 'application/octet-stream'
                        });
                    } catch(_) {
                        triedSendBlob = true;
                    }
                };
                var go = function() {
                    var reader;
                    if(triedSendBlob && triedSendArrayBufferView && triedSendBinaryString) {
                        return failWithoutRequest(cb, [24]);
                    }
                    if(isArrayBufferView(input)) {
                        if(triedSendArrayBufferView) {
                            if(!triedSendBinaryString) {
                                try {
                                    input = String.fromCharCode.apply(String, input);
                                } catch(_) {
                                    triedSendBinaryString = true;
                                }
                            } else if(!triedSendBlob) {
                                toBlob();
                            }
                        } else {
                            inputLength = input.byteLength;
                            try {
                                // if there is ArrayBufferView, then the browser supports sending instances of subclasses of ArayBufferView, otherwise we must send an ArrayBuffer
                                xhr.send(
                                    global.ArrayBufferView ?
                                    input :
                                    (
                                        input.byteOffset === 0 && input.length === input.buffer.byteLength ?
                                        input.buffer :
                                        (
                                            input.buffer.slice ?
                                            input.buffer.slice(input.byteOffset, input.byteOffset + input.length) :
                                            new Uint8Array([].slice.call(new Uint8Array(input.buffer), input.byteOffset, input.byteOffset + input.length)).buffer
                                        )
                                    )
                                );
                                return;
                            } catch(_) {
                            }
                            triedSendArrayBufferView = true;
                        }
                    } else if(global.Blob && input instanceof Blob) {
                        if(triedSendBlob) {
                            if(!triedSendArrayBufferView) {
                                try {
                                    reader = new FileReader();
                                    reader.onerror = function() {
                                        triedSendArrayBufferView = true;
                                        go();
                                    };
                                    reader.onload = function() {
                                        try {
                                            input = new Uint8Array(reader.result);
                                        } catch(_) {
                                            triedSendArrayBufferView = true;
                                        }
                                        go();
                                    };
                                    reader.readAsArrayBuffer(input);
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
                                    input = binaryStringToByteArray(input, []);
                                } catch(_) {
                                    triedSendArrayBufferView = true;
                                }
                            } else if(!triedSendBlob) {
                                toBlob();
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
                    nextTick(go);
                };
                go();
                uploadProgress(0);
            } else {
                try {
                    if(typeof input === 'string') {
                        inputLength = countStringBytes(input);
                        xhr.send(input);
                    } else {
                        inputLength = 0;
                        xhr.send(null);
                    }
                } catch(err) {
                    return failWithoutRequest(cb, [24]);
                }
                uploadProgress(0);
            }
        });

        /*************** return "abort" function **************/
        promise = function() {
            /* jshint expr:true */
            cb && cb(new Error('abort'));
            /* jshint expr:false */
            try {
                xhr.abort();
            } catch(err){
            }
        };
        return mixInPromise(promise);
    };
    httpinvoke.corsResponseContentTypeOnly = false;
    httpinvoke.corsRequestHeaders = false;
    httpinvoke.corsCredentials = false;
    httpinvoke.cors = false;
    httpinvoke.corsDELETE = false;
    httpinvoke.corsHEAD = false;
    httpinvoke.corsPATCH = false;
    httpinvoke.corsPUT = false;
    httpinvoke.corsStatus = false;
    httpinvoke.corsResponseTextOnly = false;
    httpinvoke.corsFineGrainedTimeouts = true;
    httpinvoke.requestTextOnly = false;
    httpinvoke.anyMethod = false;
    httpinvoke.relativeURLs = true;
    (function() {
        try {
            createXHR = function(cors, xhrOptions) {
                return new XMLHttpRequest(xhrOptions);
            };
            var tmpxhr = createXHR();
            httpinvoke.requestTextOnly = !global.Uint8Array && !tmpxhr.sendAsBinary;
            httpinvoke.cors = 'withCredentials' in tmpxhr;
            if(httpinvoke.cors) {
                httpinvoke.corsRequestHeaders = true;
                httpinvoke.corsCredentials = true;
                httpinvoke.corsDELETE = true;
                httpinvoke.corsPATCH = true;
                httpinvoke.corsPUT = true;
                httpinvoke.corsHEAD = true;
                httpinvoke.corsStatus = true;
                return;
            }
        } catch(err) {
        }
        try {
            if(global.XDomainRequest === _undefined) {
                createXHR = function(cors, xhrOptions) {
                    return new XMLHttpRequest(xhrOptions);
                };
                createXHR();
            } else {
                createXHR = function(cors, xhrOptions) {
                    return cors ? new XDomainRequest() : new XMLHttpRequest(xhrOptions);
                };
                createXHR(true);
                httpinvoke.cors = true;
                httpinvoke.corsResponseContentTypeOnly = true;
                httpinvoke.corsResponseTextOnly = true;
                httpinvoke.corsFineGrainedTimeouts = false;
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
        for(var i = candidates.length; i--;) {
            try {
                /* jshint loopfunc:true */
                createXHR = function() {
                    return new ActiveXObject(candidates[i]);
                };
                /* jshint loopfunc:true */
                createXHR();
                httpinvoke.requestTextOnly = true;
                return;
            } catch(err) {
            }
        }
        createXHR = _undefined;
    })();
    httpinvoke.PATCH = !!(function() {
        try {
            createXHR().open('PATCH', location.href, true);
            return 1;
        } catch(_) {
        }
    })();
    httpinvoke._hooks = initHooks();
    httpinvoke.hook = addHook;
    httpinvoke.anonymousOption = (function() {
        try {
            return createXHR(true, {mozAnon: true}).mozAnon === true &&
                   createXHR(true, {mozAnon: false}).mozAnon === false &&
                   createXHR(false, {mozAnon: true}).mozAnon === true &&
                   createXHR(false, {mozAnon: false}).mozAnon === false;
        } catch(_) {
            return false;
        }
    })();
    httpinvoke.anonymousByDefault = false;
    httpinvoke.systemOption = (function() {
        try {
            return createXHR(true, {mozAnon: true, mozSystem: true}).mozSystem === true &&
                   createXHR(true, {mozAnon: true, mozSystem: false}).mozSystem === false &&
                   createXHR(false, {mozAnon: true, mozSystem: true}).mozSystem === true &&
                   createXHR(false, {mozAnon: true, mozSystem: false}).mozSystem === false;
        } catch(_) {
            return false;
        }
    })();
    httpinvoke.systemByDefault = false;
    // http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader()-method
    httpinvoke.forbiddenInputHeaders = ['proxy-*', 'sec-*', 'accept-charset', 'accept-encoding', 'access-control-request-headers', 'access-control-request-method', 'connection', 'content-length', 'content-transfer-encoding', 'cookie', 'cookie2', 'date', 'dnt', 'expect', 'host', 'keep-alive', 'origin', 'referer', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'user-agent', 'via'];

    return httpinvoke;
};
    return build();
})
));
