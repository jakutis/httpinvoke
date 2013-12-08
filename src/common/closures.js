/* global httpinvoke, url, method, options, cb */
/* global nextTick, mixInPromise, pass, progress, reject, resolve, supportedMethods, isArray, isArrayBufferView, isFormData, isByteArray, bytearrayMessage */
/* global setTimeout */
/* global crossDomain */// this one is a hack, because when in nodejs this is not really defined, but it is never needed
/* jshint -W020 */
var promise, failWithoutRequest, uploadProgressCb, downloadProgressCb, inputLength, inputHeaders, statusCb, outputHeaders, exposedHeaders, status, outputBinary, input, outputLength, outputConverter;
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
    return function(a, b, c, d) {
        aspectBefore(a, b, c, d);
        try {
            options[name](a, b, c, d);
        } catch(_) {
        }
        aspectAfter(a, b, c, d);
    };
};
failWithoutRequest = function(cb, err) {
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
    if(err) {
        return promise[reject](err);
    }
    promise[resolve]({
        body: body,
        statusCode: statusCode,
        headers: headers
    });
});
var fixPositiveOpt = function(opt) {
    if(typeof options[opt] === 'undefined') {
        options[opt] = 0;
    } else if(typeof options[opt] === 'number') {
        if(options[opt] < 0) {
            return failWithoutRequest(cb, new Error('Option "' + opt + '" is less than zero'));
        }
    } else {
        return failWithoutRequest(cb, new Error('Option "' + opt + '" is not a number'));
    }
};
var converters = options.converters || {};
var inputConverter;
inputHeaders = options.headers || {};
outputHeaders = {};
exposedHeaders = options.corsExposedHeaders || [];
exposedHeaders.push.apply(exposedHeaders, ['Cache-Control', 'Content-Language', 'Content-Type', 'Content-Length', 'Expires', 'Last-Modified', 'Pragma', 'Content-Range', 'Content-Encoding']);
/*************** COMMON convert and validate parameters **************/
var partialOutputMode = options.partialOutputMode || 'disabled';
if(partialOutputMode.indexOf(',') >= 0 || ',disabled,chunked,joined,'.indexOf(',' + partialOutputMode + ',') < 0) {
    return failWithoutRequest(cb, new Error('Option "partialOutputMode" is neither "disabled", nor "chunked", nor "joined"'));
}
if(method.indexOf(',') >= 0 || supportedMethods.indexOf(',' + method + ',') < 0) {
    return failWithoutRequest(cb, new Error('Unsupported method ' + method));
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
    return failWithoutRequest(cb, new Error('Unsupported outputType ' + optionsOutputType));
}
inputConverter = pass;
var optionsInputType = options.inputType;
input = options.input;
if(typeof input !== 'undefined') {
    if(!optionsInputType || optionsInputType === 'auto') {
        if(typeof input !== 'string' && !isByteArray(input) && !isFormData(input)) {
            return failWithoutRequest(cb, new Error('inputType is undefined or auto and input is neither string, nor FormData, nor ' + bytearrayMessage));
        }
    } else if(optionsInputType === 'text') {
        if(typeof input !== 'string') {
            return failWithoutRequest(cb, new Error('inputType is text, but input is not a string'));
        }
    } else if (optionsInputType === 'formdata') {
        if(!isFormData(input)) {
            return failWithoutRequest(cb, new Error('inputType is formdata, but input is not an instance of FormData'));
        }
    } else if (optionsInputType === 'bytearray') {
        if(!isByteArray(input)) {
            return failWithoutRequest(cb, new Error('inputType is bytearray, but input is neither ' + bytearrayMessage));
        }
    } else if(converters[optionsInputType + ' text']) {
        inputConverter = converters[optionsInputType + ' text'];
    } else if(converters[optionsInputType + ' bytearray']) {
        inputConverter = converters[optionsInputType + ' bytearray'];
    } else if(converters[optionsInputType + ' formdata']) {
        inputConverter = converters[optionsInputType + ' formdata'];
    } else {
        return failWithoutRequest(cb, new Error('There is no converter for specified inputType'));
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
        return failWithoutRequest(cb, new Error('"input" is undefined, but inputType is defined'));
    }
    if(inputHeaders['Content-Type']) {
        return failWithoutRequest(cb, new Error('"input" is undefined, but Content-Type request header is defined'));
    }
}
var isValidTimeout = function(timeout) {
    return timeout > 0 && timeout < 1073741824;
};
var optionsTimeout = options.timeout;
if(typeof optionsTimeout !== 'undefined') {
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
        return failWithoutRequest(cb, new Error('"timeout" value is not valid'));
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

