var parseURL = require('url').parse;
var zlib = require('zlib');
var protocolImplementations = {
    http: require('http'),
    https: require('https')
};

/* jshint unused:true */
;;var resolve = 0, reject = 1, progress = 2, chain = function(a, b) {
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

var copy = function(from, to) {
    'use strict';
    Object.keys(from).forEach(function(key) {
        to[key] = from[key];
    });
    return to;
};

var emptyBuffer = new Buffer([]);

var utf8CharacterSizeFromHeaderByte = function(b) {
    'use strict';
    if(b < 128) {
        // one byte, ascii character
        return 1;
    }
    /* jshint bitwise:false */
    var mask = (1 << 7) | (1 << 6);
    var test = 128;
    if((b & mask) === test) {
        // b is not a header byte
        return 0;
    }
    for(var length = 1; (b & mask) !== test; length += 1) {
        mask = (mask >> 1) | 128;
        test = (test >> 1) | 128;
    }
    /* jshint bitwise:true */
    // multi byte utf8 character
    return length;
};

var build = function() {
'use strict';

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
    inputHeaders = copy(inputHeaders, {});
    if(typeof input !== 'undefined') {
        input = new Buffer(input);
        inputLength = input.length;
        inputHeaders['Content-Length'] = String(inputLength);
    } else {
        inputLength = 0;
    }
    inputHeaders['Accept-Encoding'] = 'gzip, deflate, identity';

    var ignorantlyConsume = function(res) {
        res.on('data', pass);
        res.on('end', pass);
    };
    url = parseURL(url);
    var req = protocolImplementations[protocol].request({
        hostname: url.hostname,
        port: Number(url.port),
        path: url.path,
        method: method,
        headers: inputHeaders
    }, function(res) {
        var contentEncoding;
        if(!cb) {
            return ignorantlyConsume(res);
        }

        outputHeaders = res.headers;
        if('content-encoding' in outputHeaders) {
            contentEncoding = outputHeaders['content-encoding'];
            if(['identity', 'gzip', 'deflate'].indexOf(contentEncoding) < 0) {
                cb(new Error('unsupported Content-Encoding ' + contentEncoding));
                cb = null;
                return ignorantlyConsume(res);
            }
            delete outputHeaders['content-encoding'];
        } else {
            contentEncoding = 'identity';
        }

        status = res.statusCode;

        uploadProgressCb(inputLength, inputLength);
        if(!cb) {
            return ignorantlyConsume(res);
        }

        statusCb(status, outputHeaders);
        if(!cb) {
            return ignorantlyConsume(res);
        }

        if(contentEncoding === 'identity' && 'content-length' in outputHeaders) {
            outputLength = Number(outputHeaders['content-length']);
        }

        var partial = partialOutputMode === 'disabled' ? _undefined : (outputBinary ? [] : '');

        downloadProgressCb(0, outputLength, partial);
        if(!cb) {
            return ignorantlyConsume(res);
        }
        if(method === 'HEAD') {
            ignorantlyConsume(res);
            downloadProgressCb(0, 0, partial);
            return cb && cb(null, _undefined, status, outputHeaders);
        }

        var inputStream;
        if(contentEncoding === 'identity') {
            inputStream = res;
        } else {
            inputStream = zlib['create' + (contentEncoding === 'gzip' ? 'Gunzip' : 'InflateRaw')]();
            res.pipe(inputStream);
        }

        var output = [], downloaded = 0, leftover = emptyBuffer;
        inputStream.on('data', function(chunk) {
            if(!cb) {
                return;
            }

            if(partialOutputMode !== 'disabled' && !outputBinary) {
                chunk = Buffer.concat([leftover, chunk]);
                var charsize = 0, newLeftoverLength = 0;
                while(charsize === 0 && newLeftoverLength < chunk.length) {
                    newLeftoverLength += 1;
                    charsize = utf8CharacterSizeFromHeaderByte(chunk[chunk.length - newLeftoverLength]);
                }
                if(newLeftoverLength === charsize) {
                    leftover = emptyBuffer;
                } else {
                    leftover = chunk.slice(chunk.length - newLeftoverLength);
                    chunk = chunk.slice(0, chunk.length - newLeftoverLength);
                }
            }

            downloaded += chunk.length;
            output.push(chunk);

            var partial;

            if(partialOutputMode !== 'disabled') {
                partial = partialOutputMode === 'chunked' ? chunk : Buffer.concat(output);
                if(!outputBinary) {
                    partial = partial.toString('utf8');
                }
            }

            downloadProgressCb(downloaded, outputLength, partial);
        });
        inputStream.on('error', cb);
        inputStream.on('end', function() {
            if(!cb) {
                return;
            }

            // just in case the utf8 text stream was damaged, and there is leftover
            output.push(leftover);
            downloaded += leftover.length;

            if(typeof outputLength === 'undefined') {
                outputLength = downloaded;
            }

            if(downloaded !== outputLength) {
                return cb(new Error('network error'));
            }

            output = Buffer.concat(output, downloaded);
            if(!outputBinary) {
                output = output.toString('utf8');
            }

            var partial;
            if(partialOutputMode === 'chunked') {
                partial = outputBinary ? leftover : leftover.toString('utf8');
            } else if(partialOutputMode === 'joined') {
                partial = outputBinary ? output : output.toString('utf8');
            }

            downloadProgressCb(outputLength, outputLength, partial);
            if(!cb) {
                return;
            }

            if(outputLength === 0 && typeof outputHeaders['content-type'] === 'undefined') {
                return cb(null, _undefined, status, outputHeaders);
            }

            try {
                cb(null, outputConverter(output), status, outputHeaders);
            } catch(err) {
                cb(err);
            }
        });
    });

    nextTick(function() {
        if(!cb) {
            return;
        }
        uploadProgressCb(0, inputLength);
    });
    if(typeof input !== 'undefined') {
        req.write(input);
    }
    req.on('error', function() {
        if(!cb) {
            return;
        }
        cb(new Error('network error'));
    });
    req.end();
    promise = function() {
        if(!cb) {
            return;
        }
        cb(new Error('abort'));
    };
    return mixInPromise(promise);
};
httpinvoke.corsResponseContentTypeOnly = false;
httpinvoke.corsRequestHeaders = true;
httpinvoke.corsCredentials = true;
httpinvoke.cors = true;
httpinvoke.corsDELETE = true;
httpinvoke.corsHEAD = true;
httpinvoke.corsPATCH = true;
httpinvoke.corsPUT = true;
httpinvoke.corsStatus = true;
httpinvoke.corsResponseTextOnly = false;
httpinvoke.requestTextOnly = false;
httpinvoke.PATCH = true;
httpinvoke.corsFineGrainedTimeouts = true;
httpinvoke.anyMethod = true;
httpinvoke.relativeURLs = false;
httpinvoke.anonymousOption = false;
httpinvoke.anonymousByDefault = true;
httpinvoke.systemOption = false;
httpinvoke.systemByDefault = true;
httpinvoke.forbiddenInputHeaders = [];
httpinvoke._hooks = initHooks();
httpinvoke.hook = addHook;

return httpinvoke;
};

module.exports = build();
