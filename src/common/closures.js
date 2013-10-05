var mixInPromise, promise, failWithoutRequest, uploadProgressCb, inputLength, noData, timeout, inputHeaders, corsOriginHeader, statusCb, initDownload, updateDownload, outputHeaders, exposedHeaders, status, outputBinary, input, outputLength, outputConverter;
/*************** COMMON initialize parameters **************/
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
var safeCallback = function(name, aspect) {
    if(name in options) {
        return function(a, b, c, d) {
            try {
                options[name](a, b, c, d);
            } catch(_) {
            }
            aspect(a, b, c, d);
        };
    }
    return aspect;
};
mixInPromise = function(o) {
    var state = [];
    var chain = function(p, promise) {
        if(p && p.then) {
            p.then(promise.resolve.bind(promise), promise.reject.bind(promise), promise.notify.bind(promise));
        }
    };
    var loop = function(value) {
        if(!isArray(state)) {
            return;
        }
        var name, after = function() {
            state = value;
        };
        if(value instanceof Error) {
            name = 'onreject';
        } else if(value.type) {
            name = 'onnotify';
            after = pass;
        } else {
            name = 'onresolve';
        }
        var p;
        for(var i = 0; i < state.length; i++) {
            try {
                p = state[i][name].call(null, value);
                if(after !== pass) {
                    chain(p, state[i].promise);
                }
            } catch(_) {
            }
        }
        after();
    };
    o.then = function(onresolve, onreject, onnotify) {
        var promise = mixInPromise({});
        if(isArray(state)) {
            // TODO see if the property names are minifed
            state.push({
                onresolve: onresolve,
                onreject: onreject,
                onnotify: onnotify,
                promise: promise
            });
        } else if(state instanceof Error) {
            nextTick(function() {
                chain(onreject(state), promise);
            });
        } else {
            nextTick(function() {
                chain(onresolve(state), promise);
            });
        }
        return promise;
    };
    o.notify = loop;
    o.resolve = loop;
    o.reject = loop;
    return o;
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

uploadProgressCb = safeCallback('uploading', function(current, total) {
    promise.notify({
        type: 'upload',
        current: current,
        total: total
    });
});
var downloadProgressCb = safeCallback('downloading', function(current, total) {
    promise.notify({
        type: 'download',
        current: current,
        total: total
    });
});
statusCb = safeCallback('gotStatus', function(statusCode, headers) {
    promise.notify({
        type: 'headers',
        statusCode: statusCode,
        headers: headers
    });
});
cb = safeCallback('finished', function(err, body, statusCode, headers) {
    if(err) {
        return promise.reject(err);
    }
    promise.resolve({
        body: body,
        statusCode: statusCode,
        headers: headers
    });
});
timeout = options.timeout || 0;
var converters = options.converters || {};
var inputConverter;
inputLength = 0;
inputHeaders = options.headers || {};
outputHeaders = {};
exposedHeaders = options.corsExposedHeaders || [];
exposedHeaders.push.apply(exposedHeaders, ['Cache-Control', 'Content-Language', 'Content-Type', 'Content-Length', 'Expires', 'Last-Modified', 'Pragma', 'Content-Range']);
corsOriginHeader = options.corsOriginHeader || 'X-Httpinvoke-Origin';
/*************** COMMON convert and validate parameters **************/
if(indexOf(supportedMethods, method) < 0) {
    return failWithoutRequest(cb, new Error('Unsupported method ' + method));
}
outputBinary = options.outputType === 'bytearray';
if(!options.outputType || options.outputType === 'text' || outputBinary) {
    outputConverter = pass;
} else if(converters['text ' + options.outputType]) {
    outputConverter = converters['text ' + options.outputType];
    outputBinary = false;
} else if(converters['bytearray ' + options.outputType]) {
    outputConverter = converters['bytearray ' + options.outputType];
    outputBinary = true;
} else {
    return failWithoutRequest(cb, new Error('Unsupported outputType ' + options.outputType));
}
inputConverter = pass;
if('input' in options) {
    input = options.input;
    if(!options.inputType || options.inputType === 'auto') {
        if(typeof input !== 'string' && !isByteArray(input)) {
            return failWithoutRequest(cb, new Error('inputType is undefined or auto and input is neither string, nor ' + bytearrayMessage));
        }
    } else if(options.inputType === 'text') {
        if(typeof input !== 'string') {
            return failWithoutRequest(cb, new Error('inputType is text, but input is not a string'));
        }
    } else if (options.inputType === 'bytearray') {
        if(!isByteArray(input)) {
            return failWithoutRequest(cb, new Error('inputType is bytearray, but input is neither ' + bytearrayMessage));
        }
    } else if(converters[options.inputType + ' text']) {
        inputConverter = converters[options.inputType + ' text'];
    } else if(converters[options.inputType + ' bytearray']) {
        inputConverter = converters[options.inputType + ' bytearray'];
    } else {
        return failWithoutRequest(cb, new Error('There is no converter for specified inputType'));
    }
    if(typeof input === 'string') {
        if(!inputHeaders['Content-Type']) {
            inputHeaders['Content-Type'] = 'text/plain; charset=UTF-8';
        }
    } else {
        if(!inputHeaders['Content-Type']) {
            inputHeaders['Content-Type'] = 'application/octet-stream';
        }
        if(global.ArrayBuffer && input instanceof ArrayBuffer) {
            input = new Uint8Array(input);
        } else if(isArrayBufferView(input)) {
            input = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
        }
    }
    try {
        input = inputConverter(input);
    } catch(err) {
        return failWithoutRequest(cb, err);
    }
} else {
    if(options.inputType) {
        return failWithoutRequest(cb, new Error('"input" is undefined, but inputType is defined'));
    }
    if(inputHeaders['Content-Type']) {
        return failWithoutRequest(cb, new Error('"input" is undefined, but Content-Type request header is defined'));
    }
}

/*************** COMMON initialize helper variables **************/
var downloaded;
initDownload = function(total) {
    if(typeof outputLength === 'undefined') {
        downloadProgressCb(downloaded, outputLength = total);
    }
};
updateDownload = function(value) {
    if(value !== downloaded) {
        downloadProgressCb(downloaded = value, outputLength);
    }
};
noData = function() {
    initDownload(0);
    if(cb) {
        // TODO what happens if we try to call abort in cb?
        cb(null, _undefined, status, outputHeaders);
        cb = null;
    }
};
