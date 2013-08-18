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

    var urlPartitioningRegExp = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/;
    var isCrossDomain = function(location, uri) {
        uri = urlPartitioningRegExp.exec(uri.toLowerCase());
        location = urlPartitioningRegExp.exec(location.toLowerCase()) || [];
        return !!(uri && (uri[1] !== location[1] || uri[2] !== location[2] || (uri[3] || (uri[1] === 'http:' ? '80' : '443')) !== (location[3] || (location[1] === 'http:' ? '80' : '443'))));
    };
    var noop = function() {};
    var createXHR;
    var httpinvoke = function(uri, method, options) {
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

        var uploadProgressCb = options.uploading || noop;
        var downloadProgressCb = options.downloading || noop;
        var statusCb = options.gotStatus || noop;
        var cb = options.finished || noop;
        var input = options.input || null, inputLength = input === null ? 0 : input.length, inputHeaders = options.headers || {};
        var exposedHeaders = options.corsHeaders || [];
        exposedHeaders.push.apply(exposedHeaders, ['Cache-Control', 'Content-Language', 'Content-Type', 'Expires', 'Last-Modified', 'Pragma']);

        var uploadProgressCbCalled = false;

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
        // IE may throw an exception when accessing
        // a field from window.location if document.domain has been set
        var currentLocation;
        try {
            currentLocation = window.location.href;
        } catch(_) {
            // Use the href attribute of an A element
            // since IE will modify it given document.location
            currentLocation = window.document.createElement('a');
            currentLocation.href = '';
            currentLocation = currentLocation.href;
        }
        var output, outputLength = null, outputHeaders = {};
        var i;
        var xhr = createXHR(isCrossDomain(currentLocation, uri));
        xhr.open(method, uri, true);
        if(options.corsCredentials && httpinvoke.corsCredentials) {
            xhr.withCredentials = true;
        }

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
                    if(!uploadProgressCbCalled) {
                        uploadProgressCbCalled = true;
                        uploadProgressCb(0, inputLength);
                    }
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
            xhr.onerror = function() {
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
                // TODO query xhr.responseText.length as a fallback
                if(typeof progressEvent !== 'undefined' && progressEvent.lengthComputable) {
                    if(outputLength === null) {
                        outputLength = progressEvent.total;
                        downloadProgressCb(0, outputLength);
                    }
                    downloadProgressCb(progressEvent.loaded, outputLength);
                }
            };
        }
        var onHeadersReceived = function(lastTry) {
            if(cb === null) {
                return;
            }

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
            try {
                fillOutputHeaders(xhr, outputHeaders);
            } catch(err) {
                if(!lastTry) {
                    throw err;
                }
                for(var i = 0; i < exposedHeaders.length; i += 1) {
                    try {
                        var header = xhr.getResponseHeader(exposedHeaders[i]);
                        if(typeof header === 'string') {
                            outputHeaders[exposedHeaders[i].toLowerCase()] = header;
                        }
                    } catch(err) {
                    }
                }
            }

            if(!uploadProgressCbCalled) {
                uploadProgressCbCalled = true;
                uploadProgressCb(0, inputLength);
            }
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
        var onLoad = function(a, b, c) {
            if(cb === null) {
                return;
            }

            if(xhr.status === 0) {
                cb(new Error('"some type" of network error'));
                cb = null;
                return;
            }

            onHeadersReceived(true);
            if(cb === null) {
                return;
            }

            output = (typeof xhr.responseType === 'undefined' || xhr.responseType === '') ? 'text' : xhr.responseType;
            if(output === 'text') {
                output = xhr.responseText;
            } else {
                cb(new Error('Unknown response body format ' + output));
                cb = null;
                return;
            }

            if(outputLength === null) {
                outputLength = output.length;
                downloadProgressCb(0, outputLength);
            }
            if(cb === null) {
                return;
            }

            downloadProgressCb(outputLength, outputLength);
            if(cb === null) {
                return;
            }

            cb(null, output);
            cb = null;
        };
        xhr.onreadystatechange = function() {
            if(xhr.readyState === 2) {
                // HEADERS_RECEIVED
                onHeadersReceived(false);
            } else if(xhr.readyState === 4) {
                // DONE
                onLoad();
            }
        };
        xhr.onload = onLoad;
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
            if(!uploadProgressCbCalled) {
                uploadProgressCbCalled = true;
                uploadProgressCb(0, inputLength);
            }
        }, 0);
        return function() {
            if(cb === null) {
                return;
            }

            // these statements are in case "abort" is called in "finished" callback
            var _cb = cb;
            cb = null;
            _cb(new Error('abort'));

            try {
                xhr.abort();
            } catch(err){
            }
        };
    };
    httpinvoke.corsCredentials = false;
    httpinvoke.cors = false;
    (function() {
        try {
            createXHR = function() {
                return new XMLHttpRequest();
            };
            httpinvoke.cors = 'withCredentials' in createXHR();
            if(!httpinvoke.cors) {
                throw '';
            }
            httpinvoke.corsCredentials = true;
            return;
        } catch(err) {
        }
        try {
            if(typeof XDomainRequest === 'undefined') {
                createXHR = function() {
                    return new XMLHttpRequest();
                };
                createXHR();
            } else {
                createXHR = function(cors) {
                    return cors ? new XDomainRequest() : new XMLHttpRequest();
                };
                createXHR(true);
                httpinvoke.cors = true;
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
        var i = candidates.length - 1;
        while(i >= 0) {
            try {
                createXHR = function() {
                    return new ActiveXObject(candidates[i]);
                };
                createXHR();
                return;
            } catch(err) {
            }
            i -= 1;
        }
        createXHR = function() {
            throw new Error('Cannot construct XMLHttpRequest');
        };
    })();

    return httpinvoke;
}));
