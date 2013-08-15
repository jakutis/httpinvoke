(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.httpinvoke = factory();
  }
}(this, function () {
    var createXHR = function() {
        var candidates = ['Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.6.0', 'Msxml2.XMLHTTP.3.0', 'Msxml2.XMLHTTP'].map(function(type) {
            return function() {
                return new ActiveXObject(type);
            };
        });
        candidates.unshift(function() {
            return new XMLHttpRequest();
        });

        var xhr;
        if(candidates.some(function(create) {
            try {
                xhr = create();
                createXHR = create;
                return true;
            } catch(e) {
                return false;
            }
        })) {
            return xhr;
        } else {
            createXHR = function() {
                throw new Error('Cannot construct XMLHttpRequest');
            };
            return createXHR();
        }
    };

    var parseHeader = function(header) {
        var colon = header.indexOf(':');
        return {
            name: header.slice(0, colon).toLowerCase(),
            value: header.slice(colon + 1).trim()
        };
    };

    // http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader()-method
    var forbiddenInputHeaders = ['Accept-Charset', 'Accept-Encoding', 'Access-Control-Request-Headers', 'Access-Control-Request-Method', 'Connection', 'Content-Length', 'Cookie', 'Cookie2', 'Date', 'DNT', 'Expect', 'Host', 'Keep-Alive', 'Origin', 'Referer', 'TE', 'Trailer', 'Transfer-Encoding', 'Upgrade', 'User-Agent', 'Via'].map(function(header) {
        return header.toLowerCase();
    });
    var validateInputHeaders = function(headers) {
        for(var header in headers) {
            if(headers.hasOwnProperty(header)) {
                var headerl = header.toLowerCase();
                if(forbiddenInputHeaders.indexOf(headerl) >= 0) {
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
        var deleteCallbacks = function() {
            uploadProgressCb = null;
            downloadProgressCb = null;
            statusCb = null;
            cb = null;
        };
        var input = options.input || null, inputLength = input === null ? 0 : input.length, inputHeaders = options.headers || [];
        try {
            validateInputHeaders(inputHeaders);
        } catch(err) {
            cb(err);
            deleteCallbacks();
            return;
        }
        var output, outputLength, outputHeaders = {};
        var xhr = createXHR();

        xhr.upload.ontimeout = function(progressEvent) {
            if(cb) {
                cb(new Error('upload timeout'));
                deleteCallbacks();
            }
        };
        xhr.upload.onerror = function(progressEvent) {
            if(cb) {
                cb(new Error('upload error'));
                deleteCallbacks();
            }
        };
        xhr.upload.onprogress = function(progressEvent) {
            if(uploadProgressCb && progressEvent.lengthComputable) {
                uploadProgressCb(0, progressEvent.loaded, inputLength);
            }
        };

        xhr.ontimeout = function(progressEvent) {
            if(cb) {
                cb(new Error('download timeout'));
                deleteCallbacks();
            }
        };
        xhr.onerror = function(progressEvent) {
            if(cb) {
                cb(new Error('download error'));
                deleteCallbacks();
            }
        };
        xhr.onprogress = function(progressEvent) {
            if(downloadProgressCb && progressEvent.lengthComputable) {
                downloadProgressCb(0, progressEvent.loaded, outputLength);
            }
        };
        xhr.onreadystatechange = function() {
            if(!cb) {
                return;
            }
            var readyState = readyStates[xhr.readyState];
            if(readyState === 'HEADERS_RECEIVED') {
                xhr.getAllResponseHeaders().split(/\r?\n/).map(function(line) {
                    return line.trim();
                }).filter(function(line) {
                    return line.length !== 0;
                }).map(parseHeader).forEach(function(header) {
                    if(typeof outputHeaders[header.name] === 'undefined') {
                        outputHeaders[header.name] = [header.value];
                    } else {
                        outputHeaders[header.name].push(header.value);
                    }
                });
                outputLength = Number(outputHeaders['content-length']);
                uploadProgressCb(0, inputLength, inputLength);
                uploadProgressCb = null;
                statusCb(xhr.status, outputHeaders);
                statusCb = null;
                downloadProgressCb(0, 0, outputLength);
            } else if(readyState === 'DONE') {
                if(xhr.status === 0) {
                    cb(new Error('"some type" of network error'));
                    deleteCallbacks();
                    return;
                }
                downloadProgressCb(0, outputLength, outputLength);
                downloadProgressCb = null;
                output = (typeof xhr.responseType === 'undefined' || xhr.responseType === '') ? 'text' : xhr.responseType;
                if(output === 'text') {
                    cb(null, xhr.responseText);
                } else {
                    cb(new Error('Unknown response body format ' + output));
                }
                deleteCallbacks();
            }
        };
        xhr.open(method, uri, true);
        for(var inputHeaderName in inputHeaders) {
            if(inputHeaders.hasOwnProperty(inputHeaderName)) {
                inputHeaders[inputHeaderName].forEach(function(headerValue) {
                    xhr.setRequestHeader(inputHeaderName, headerValue);
                });
            }
        }
        // Content-Length header is set automatically
        xhr.send(input);
        uploadProgressCb(0, 0, inputLength);
        return function() {
            if(cb) {
                cb(new Error('abort'));
                deleteCallbacks();
                try {
                    xhr.abort();
                } catch(err){
                }
            }
        };
    };
}));
