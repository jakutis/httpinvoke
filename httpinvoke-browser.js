(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.httpinvoke = factory();
  }
}(this, function () {
    var responseBodyToText, responseBodyLength;
    (function() {
        try {
            var vbscript = '';
            vbscript += 'Function HTTPINVOKE_BinaryToByteStr(Binary)\r\n';
            vbscript += '    HTTPINVOKE_BinaryToByteStr = CStr(Binary)\r\n';
            vbscript += 'End Function\r\n';
            vbscript += '\r\n';
            vbscript += 'Function HTTPINVOKE_BinaryLen(Binary)\r\n';
            vbscript += '    HTTPINVOKE_BinaryLen = LenB(Binary)\r\n';
            vbscript += 'End Function\r\n';
            vbscript += '\r\n';
            vbscript += 'Function HTTPINVOKE_BinaryToByteStrLast(Binary)\r\n';
            vbscript += '    Dim lastIndex\r\n';
            vbscript += '    lastIndex = LenB(Binary)\r\n';
            vbscript += '    If lastIndex mod 2 Then\r\n';
            vbscript += '        HTTPINVOKE_BinaryToByteStrLast = Chr(AscB(MidB(Binary, lastIndex, 1)))\r\n';
            vbscript += '    Else\r\n';
            vbscript += '        HTTPINVOKE_BinaryToByteStrLast = ""\r\n';
            vbscript += '    End If\r\n';
            vbscript += 'End Function\r\n';
            window.execScript(vbscript, 'vbscript');

            var byteMapping = {};
            for(var i = 0; i < 256; i += 1) {
                for (var j = 0; j < 256; j += 1) {
                    byteMapping[String.fromCharCode(i + j * 256)] = String.fromCharCode(i) + String.fromCharCode(j);
                }
            }
            responseBodyToText = function(binary) {
                return HTTPINVOKE_BinaryToByteStr(binary).replace(/[\s\S]/g, function(match) {
                    return byteMapping[match];
                }) + HTTPINVOKE_BinaryToByteStrLast(binary);
            };
            responseBodyLength = function(binary) {
                return HTTPINVOKE_BinaryLen(binary);
            };
        } catch(err) {
        }
    })();
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

    var supportedMethods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'];

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

        var initDownload = function(total) {
            if(outputLength !== null) {
                return;
            }
            outputLength = total;
            downloadProgressCb(0, outputLength);
        };
        var updateDownload = function(value) {
            if(outputLength === null) {
                return;
            }
            downloadProgressCb(value, outputLength);
        };

        var uploadProgressCbCalled = false;
        var failWithoutRequest = function(err) {
            setTimeout(function() {
                if(cb === null) {
                    return;
                }
                cb(err);
            }, 0);
            return noop;
        };

        if(indexOf(supportedMethods, method) < 0) {
            return failWithoutRequest(new Error('Unsupported method ' + method));
        }

        try {
            validateInputHeaders(inputHeaders);
        } catch(err) {
            return failWithoutRequest(err);
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
        var crossDomain = isCrossDomain(currentLocation, uri);
        if(crossDomain && !httpinvoke.cors) {
            return failWithoutRequest(new Error('Cross-origin requests are not supported'));
        }
        var overrideMimeType = false;
        var xhr = createXHR(crossDomain);
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
                if(typeof progressEvent !== 'undefined' && progressEvent.lengthComputable) {
                    initDownload(progressEvent.total);
                    updateDownload(progressEvent.loaded);
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
            var status;
            try {
                if(typeof xhr.status === 'undefined') {
                    return;
                }
                status = xhr.status;
            } catch(_) {
                return;
            }
            // sometimes IE returns 1223 when it should be 204
            if(status === 1223) {
                status = 204;
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

            statusCb(status, outputHeaders);
            statusCb = null;
            if(cb === null) {
                return;
            }

            if(method === 'HEAD' || status === 204) {
                initDownload(0);
                if(cb === null) {
                    return;
                }
                updateDownload(0);
                if(cb === null) {
                    return;
                }
                cb(null, null);
                cb = null;
                return;
            }

            if(typeof outputHeaders['content-length'] !== 'undefined') {
                // TODO check if it is correct when Content-Encoding is gzip
                initDownload(Number(outputHeaders['content-length']));
            }
        };
        var onLoad = function() {
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

            output = (overrideMimeType || typeof xhr.responseBody === 'undefined') ? xhr.responseText : responseBodyToText(xhr.responseBody);

            initDownload(output.length);
            if(cb === null) {
                return;
            }

            updateDownload(outputLength);
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
            } else if(xhr.readyState === 3) {
                // LOADING
                try {
                    updateDownload((overrideMimeType || typeof xhr.responseBody === 'undefined') ? xhr.responseText.length : responseBodyLength(xhr.responseBody));
                } catch(err) {
                }
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
        if(xhr.overrideMimeType) {
            overrideMimeType = true;
            xhr.overrideMimeType('text/plain; charset=iso-8859-1');
        }
        setTimeout(function() {
            if(cb === null) {
                return;
            }
            // Content-Length header is set automatically
            xhr.send(input);
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
