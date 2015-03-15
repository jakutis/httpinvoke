/* global httpinvoke, url, method, options, cb */
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

