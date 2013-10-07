var mixInPromise, promise, failWithoutRequest, uploadProgressCb, inputLength, noData, timeout, inputHeaders, statusCb, initDownload, updateDownload, outputHeaders, exposedHeaders, status, outputBinary, input, outputLength, outputConverter;
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
var chain = function(a, b) {
    a && a.then && a.then(function() {
        b[resolve].apply(null, arguments);
    }, function() {
        b[reject].apply(null, arguments);
    }, function() {
        b[progress].apply(null, arguments);
    });
};
var resolve = 0, reject = 1, progress = 2;
mixInPromise = function(o) {
    var value, queue = [], state = progress;
    var makeState = function(newstate) {
        o[newstate] = function(newvalue) {
            var i, p;
            if(queue) {
                value = newvalue;
                state = newstate;

                for(i = 0; i < queue.length; i++) {
                    if(typeof queue[i][state] === 'function') {
                        try {
                            p = queue[i][state].call(null, value);
                            if(state < progress) {
                                chain(p, queue[i]._);
                            }
                        } catch(err) {
                            queue[i]._[reject](err);
                        }
                    } else if(state < progress) {
                        queue[i]._[state](value);
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
                chain(item[state](value), item._);
            });
        }
        return item._;
    };
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
    promise[progress]({
        type: 'upload',
        current: current,
        total: total
    });
});
var downloadProgressCb = safeCallback('downloading', function(current, total) {
    promise[progress]({
        type: 'download',
        current: current,
        total: total
    });
});
statusCb = safeCallback('gotStatus', function(statusCode, headers) {
    promise[progress]({
        type: 'headers',
        statusCode: statusCode,
        headers: headers
    });
});
cb = safeCallback('finished', function(err, body, statusCode, headers) {
    if(err) {
        return promise[reject](err);
    }
    promise[resolve]({
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
/*************** COMMON convert and validate parameters **************/
if(method.indexOf(',') >= 0 || supportedMethods.indexOf(',' + method + ',') < 0) {
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
    if(typeof input === 'object') {
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
        cb(null, _undefined, status, outputHeaders);
        cb = null;
    }
};
