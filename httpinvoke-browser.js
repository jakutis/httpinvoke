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
        var output, outputLength, outputHeaders = {};
        var xhr = createXHR();

        xhr.upload.ontimeout = function(progressEvent) {
            if(cb) {
                cb(progressEvent);
                deleteCallbacks();
            }
        };
        xhr.upload.onerror = function(progressEvent) {
            if(cb) {
                cb(progressEvent);
                deleteCallbacks();
            }
        };
        xhr.upload.onprogress = function(progressEvent) {
            if(progressEvent.lengthComputable) {
                uploadProgressCb(0, progressEvent.loaded, inputLength);
            }
        };

        xhr.ontimeout = function(progressEvent) {
            if(cb) {
                cb(progressEvent);
                deleteCallbacks();
            }
        };
        xhr.onerror = function(progressEvent) {
            if(cb) {
                cb(progressEvent);
                deleteCallbacks();
            }
        };
        xhr.onprogress = function(progressEvent) {
            if(progressEvent.lengthComputable) {
                downloadProgressCb(0, progressEvent.loaded, outputLength);
            }
        };
        xhr.onreadystatechange = function(event) {
            var readyState = readyStates[event.readyState];
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
                downloadProgressCb(0, 0, outputLength);
                statusCb(xhr.status, outputHeaders);
                statusCb = null;
            } else if(readyState === 'DONE') {
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
        inputHeaders.forEach(function(header) {
            xhr.setRequestHeader(header.name, header.value);
        });
        xhr.setRequestHeader('Content-Length', inputLength);
        xhr.send(input);
        uploadProgressCb(0, 0, inputLength);
        return function() {
            if(cb) {
                try {
                    xhr.abort();
                } catch(err){
                }
                cb(new Error('aborted'));
                deleteCallbacks();
            }
        };
    };
}));
