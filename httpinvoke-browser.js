(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.httpinvoke = factory();
  }
}(this, function () {
    var trim = function(string) {
        return string.replace(/^\s+|\s+$/g,'');
    };
    var indexOf = function(array, item) {
        for(var i = 0; i < array.length; i += 1) {
            if(array[i] === item) {
                return i;
            }
        }
        return -1;
    };
    var createXHR = function() {
        try {
            createXHR = function() {
                return new XMLHttpRequest();
            };
            return createXHR();
        } catch(err) {
        }
        var candidates = ['Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.6.0', 'Msxml2.XMLHTTP.3.0', 'Msxml2.XMLHTTP'];
        var i = candidates.length - 1;
        while(i >= 0) {
            try {
                createXHR = function() {
                    return new ActiveXObject(candidates[i]);
                };
                return createXHR();
            } catch(err) {
            }
            i -= 1;
        }
        createXHR = function() {
            throw new Error('Cannot construct XMLHttpRequest');
        };
        return createXHR();
    };

    var parseHeader = function(header) {
        var colon = header.indexOf(':');
        return {
            name: header.slice(0, colon).toLowerCase(),
            value: trim(header.slice(colon + 1))
        };
    };

    // http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader()-method
    var forbiddenInputHeaders = ['accept-charset', 'accept-encoding', 'access-control-request-headers', 'access-control-request-method', 'connection', 'content-length', 'cookie', 'cookie2', 'date', 'dnt', 'expect', 'host', 'keep-alive', 'origin', 'referer', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'user-agent', 'via'];
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
    var fillOutputHeaders = function(xhr, outputHeaders) {
        var headers = xhr.getAllResponseHeaders().split(/\r?\n/);
        var i = headers.length - 1;
        var header;
        while(i >= 0) {
            header = trim(headers[i]);
            if(header.length > 0) {
                header = parseHeader(header);
                outputHeaders[header.name] = header.value;
            }
            i -= 1;
        }
    };

    var noop = function() {};
    var readyStates = ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'];
    return function(uri, method, options) {
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
        var uploadProgressCb = options.uploading || noop;
        var downloadProgressCb = options.downloading || noop;
        var statusCb = options.gotStatus || noop;
        var cb = options.finished || noop;
        var input = options.input || null, inputLength = input === null ? 0 : input.length, inputHeaders = options.headers || {};
        try {
            validateInputHeaders(inputHeaders);
        } catch(err) {
            setTimeout(function() {
                if(cb === null) {
                    return;
                }
                cb(err);
            }, 0);
            return function() {
            };
        }
        var output, outputLength = null, outputHeaders = {};
        var xhr = createXHR();
        var i;

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
            xhr.upload.onprogress = function(progressEvent) {
                if(cb === null) {
                    return;
                }
                if(progressEvent.lengthComputable) {
                    uploadProgressCb(progressEvent.loaded, inputLength);
                }
            };
        }

        if(typeof xhr.ontimeout !== 'undefined') {
            xhr.ontimeout = function(progressEvent) {
                if(cb === null) {
                    return;
                }
                cb(new Error('download timeout'));
                cb = null;
            };
        }
        if(typeof xhr.onerror !== 'undefined') {
            xhr.onerror = function(progressEvent) {
                if(cb === null) {
                    return;
                }
                cb(new Error('download error'));
                cb = null;
            };
        }
        if(typeof xhr.onprogress !== 'undefined') {
            xhr.onprogress = function(progressEvent) {
                if(cb === null) {
                    return;
                }
                if(progressEvent.lengthComputable) {
                    if(outputLength === null) {
                        outputLength = progressEvent.total;
                        downloadProgressCb(0, outputLength);
                    }
                    downloadProgressCb(progressEvent.loaded, outputLength);
                }
            };
        }
        var onHeadersReceived = function() {
            if(statusCb === null) {
                return;
            }
            try {
                if(xhr.status === 'undefined') {
                    return;
                }
            } catch(_) {
                return;
            }
            fillOutputHeaders(xhr, outputHeaders);

            uploadProgressCb(inputLength, inputLength);
            if(cb === null) {
                return;
            }

            statusCb(xhr.status, outputHeaders);
            statusCb = null;
            if(cb === null) {
                return;
            }

            if(outputLength === null && typeof outputHeaders['content-length'] !== 'undefined') {
                outputLength = Number(outputHeaders['content-length']);
                downloadProgressCb(0, outputLength);
            }
        };
        xhr.onreadystatechange = function() {
            if(cb === null) {
                return;
            }
            var readyState = readyStates[xhr.readyState];
            if(readyState === 'HEADERS_RECEIVED') {
                onHeadersReceived();
            } else if(readyState === 'DONE') {
                if(xhr.status === 0) {
                    return cb(new Error('"some type" of network error'));
                }
                onHeadersReceived();

                if(outputLength === null) {
                    downloadProgressCb(0, 0);
                    downloadProgressCb(0, 0);
                } else {
                    downloadProgressCb(outputLength, outputLength);
                }
                if(cb === null) {
                    return;
                }

                output = (typeof xhr.responseType === 'undefined' || xhr.responseType === '') ? 'text' : xhr.responseType;
                if(output === 'text') {
                    cb(null, xhr.responseText);
                } else {
                    cb(new Error('Unknown response body format ' + output));
                }
            }
        };
        xhr.open(method, uri, true);
        for(var inputHeaderName in inputHeaders) {
            if(inputHeaders.hasOwnProperty(inputHeaderName)) {
                xhr.setRequestHeader(inputHeaderName, inputHeaders[inputHeaderName]);
            }
        }
        // Content-Length header is set automatically
        xhr.send(input);
        setTimeout(function() {
            if(cb === null) {
                return;
            }
            uploadProgressCb(0, inputLength);
        }, 0);
        return function() {
            if(cb === null) {
                return;
            }
            var _cb = cb;
            cb = null;
            _cb(new Error('abort'));
            try {
                xhr.abort();
            } catch(err){
            }
        };
    };
}));
