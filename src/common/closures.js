var uploadProgressCb, cb, inputLength, inputType, noData, timeout, corsCredentials, inputHeaders, corsOriginHeader, statusCb, initDownload, updateDownload, outputHeaders, exposedHeaders, status, outputType, input, outputLength, outputConverter, _undefined;
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

try {
    validateInputHeaders(inputHeaders);
} catch(err) {
    return failWithoutRequest(cb, err);
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
