(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.httpinvoke = factory();
  }
}(this, function () {
    var responseBodyToBytes, responseBodyLength;
    (function() {
        try {
            var vbscript = '';
            vbscript += 'Function httpinvoke_BinaryExtract(Binary, Array)\r\n';
            vbscript += '    Dim len, i\r\n';
            vbscript += '    len = LenB(Binary)\r\n';
            vbscript += '    For i = 1 to len\r\n';
            vbscript += '        Array.push(AscB(MidB(Binary, i, 1)))\r\n';
            vbscript += '    Next\r\n';
            vbscript += 'End Function\r\n';
            vbscript += '\r\n';
            vbscript += 'Function httpinvoke_BinaryLength(Binary)\r\n';
            vbscript += '    httpinvoke_BinaryLength = LenB(Binary)\r\n';
            vbscript += 'End Function\r\n';
            vbscript += '\r\n';
            window.execScript(vbscript, 'vbscript');

            var byteMapping = {};
            for(var i = 0; i < 256; i += 1) {
                for (var j = 0; j < 256; j += 1) {
                    byteMapping[String.fromCharCode(i + j * 256)] = String.fromCharCode(i) + String.fromCharCode(j);
                }
            }
            responseBodyToBytes = function(binary) {
                var bytes = [];
                window.httpinvoke_BinaryExtract(binary, bytes);
                return bytes;
            };
            responseBodyLength = function(binary) {
                return window.httpinvoke_BinaryLength(binary);
            };
        } catch(err) {
        }
    })();
    var getOutput = {
        'text' : function(xhr) {
            if(typeof xhr.response !== 'undefined') {
                return xhr.response;
            }
            return xhr.responseText;
        },
        'bytearray' : function(xhr) {
            if(typeof xhr.response !== 'undefined') {
                return new Uint8Array(xhr.response);
            }
            if(typeof xhr.responseBody !== 'undefined') {
                return responseBodyToBytes(xhr.responseBody);
            }
            var str = xhr.responseText, n = str.length, bytearray = new Array(n);
            for(var i = 0; i < n; i += 1) {
                bytearray[i] = str.charCodeAt(i) & 0xFF;
            }
            if(typeof Uint8Array !== 'undefined') {
                // firefox 4 supports typed arrays but not xhr2
                return new Uint8Array(bytearray);
            }
            return bytearray;
        }
    };
    var getOutputLength = {
        'text': function(xhr) {
            return countStringBytes(getOutput.text(xhr));
        },
        'bytearray': function(xhr) {
            if(typeof xhr.response !== 'undefined') {
                return xhr.response.byteLength;
            }
            if(typeof xhr.responseBody !== 'undefined') {
                return responseBodyLength(xhr.responseBody);
            }
            return xhr.responseText.length;
        }
    };

    var trim = typeof ''.trim === 'undefined' ? function(string) {
        return string.replace(/^\s+|\s+$/g,'');
    } : function(string) {
        return string.trim();
    };
    var indexOf = typeof [].indexOf === 'undefined' ? function(array, item) {
        for(var i = 0; i < array.length; i += 1) {
            if(array[i] === item) {
                return i;
            }
        }
        return -1;
    } : function(array, item) {
        return array.indexOf(item);
    };
    var countStringBytes = function(string) {
        var n = 0;
        for(var i = 0; i < string.length; i += 1) {
            var c = string.charCodeAt(i);
            if (c < 128) {
                n += 1;
            } else if (c < 2048) {
                n += 2;
            } else {
                n += 3;
            }
        }
        return n;
    };
    var convertByteArrayToBinaryString = function(bytearray) {
        var str = '';
        for(var i = 0; i < bytearray.length; i += 1) {
            str += String.fromCharCode(bytearray[i]);
        }
        return str;
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
    var forbiddenInputHeaders = ['accept-charset', 'accept-encoding', 'access-control-request-headers', 'access-control-request-method', 'connection', 'content-length', 'content-transfer-encoding', 'cookie', 'cookie2', 'date', 'dnt', 'expect', 'host', 'keep-alive', 'origin', 'referer', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'user-agent', 'via'];
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
    var failWithoutRequest = function(cb, err) {
        setTimeout(function() {
            if(cb === null) {
                return;
            }
            cb(err);
        }, 0);
        return noop;
    };
    var noop = function() {};
    var createXHR;
    var httpinvoke = function(uri, method, options) {
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
        // TODO is it possible to support progress events when size is not known - make second argument to "downloading" optional?
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
        var uploadProgressCb = safeCallback('uploading');
        var downloadProgressCb = safeCallback('downloading');
        var statusCb = safeCallback('gotStatus');
        var cb = safeCallback('finished');
        var timeout = options.timeout || 0;
        // TODO make sure the undefined output and input cases are thoroughly handled
        var input, inputLength, inputHeaders = options.headers || {};
        var inputType;
        var outputType = options.outputType || "text";
        var exposedHeaders = options.corsHeaders || [];
        var corsOriginHeader = options.corsOriginHeader || 'X-Httpinvoke-Origin';
        exposedHeaders.push.apply(exposedHeaders, ['Cache-Control', 'Content-Language', 'Content-Type', 'Expires', 'Last-Modified', 'Pragma']);

        /*************** COMMON convert and validate parameters **************/
        if(indexOf(supportedMethods, method) < 0) {
            return failWithoutRequest(cb, new Error('Unsupported method ' + method));
        }
        if(outputType !== 'text' && outputType !== 'bytearray') {
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
            if(typeof options.inputType === 'undefined') {
                inputType = 'auto';
            } else {
                inputType = options.inputType;
                if(inputType !== 'auto' && inputType !== 'text' && inputType !== 'bytearray') {
                    return failWithoutRequest(cb, new Error('Unsupported inputType ' + inputType));
                }
            }
            if(inputType === 'auto') {
                if(typeof inputHeaders['Content-Type'] === 'undefined') {
                    return failWithoutRequest(cb, new Error('inputType is auto and Content-Type request header is not specified'));
                }
                if(typeof inputHeaders['Content-Type'] === 'undefined') {
                    inputType = 'bytearray';
                } else if(inputHeaders['Content-Type'].substr(0, 'text/'.length) === 'text/') {
                    inputType = 'text';
                } else {
                    inputType = 'bytearray';
                }
            }
            if(inputType === 'text') {
                if(typeof options.input !== 'string') {
                    return failWithoutRequest(cb, new Error('inputType is text, but input is not a string'));
                }
                input = options.input;
                inputLength = countStringBytes(input);
                if(typeof inputHeaders['Content-Type'] === 'undefined') {
                    inputHeaders['Content-Type'] = 'text/plain; charset=UTF-8';
                }
            } else if(inputType === 'bytearray') {
                if(typeof options.input === 'object' && options.input !== null) {
                    if(typeof Uint8Array !== 'undefined' && options.input instanceof Uint8Array) {
                        options.input = options.input.buffer;
                    }

                    if(typeof ArrayBuffer !== 'undefined' && options.input instanceof ArrayBuffer) {
                        input = options.input;
                        inputLength = input.byteLength;
                    } else if(typeof Buffer !== 'undefined' && options.input instanceof Buffer) {
                        input = options.input;
                        inputLength = input.length;
                    } else if(Object.prototype.toString.call(options.input) !== '[object Array]') {
                        input = convertByteArrayToBinaryString(options.input);
                        inputLength = input.length;
                    } else {
                        return failWithoutRequest(cb, new Error('inputType is bytearray, but input is neither Uint8Array, nor ArrayBuffer, nor Buffer, nor Array'));
                    }
                } else {
                    return failWithoutRequest(cb, new Error('inputType is bytearray, but input is neither Uint8Array, nor ArrayBuffer, nor Buffer, nor Array'));
                }
                if(typeof inputHeaders['Content-Type'] === 'undefined') {
                    inputHeaders['Content-Type'] = 'application/octet-stream';
                }
            }
        }

        try {
            validateInputHeaders(inputHeaders);
        } catch(err) {
            return failWithoutRequest(cb, err);
        }
        /*************** COMMON initialize helper variables **************/
        var downloaded, outputHeaders, outputLength;
        var initDownload = function(total) {
            if(typeof outputLength !== 'undefined') {
                return;
            }
            outputLength = total;

            downloadProgressCb(downloaded, outputLength);
        };
        var updateDownload = function(value) {
            if(value === downloaded) {
                return;
            }
            downloaded = value;

            downloadProgressCb(downloaded, outputLength);
        };
        var noData = function() {
            initDownload(0);
            if(cb === null) {
                return;
            }
            updateDownload(0);
            if(cb === null) {
                return;
            }
            cb();
            cb = null;
        };
        /*************** initialize helper variables **************/
        var uploadProgressCbCalled = false;
        var output;
        var i;
        var currentLocation;
        try {
            // IE may throw an exception when accessing
            // a field from window.location if document.domain has been set
            currentLocation = window.location.href;
        } catch(_) {
            // Use the href attribute of an A element
            // since IE will modify it given document.location
            currentLocation = window.document.createElement('a');
            currentLocation.href = '';
            currentLocation = currentLocation.href;
        }
        var crossDomain = isCrossDomain(currentLocation, uri);
        /*************** start XHR **************/
        if(crossDomain && !httpinvoke.cors) {
            return failWithoutRequest(cb, new Error('Cross-origin requests are not supported'));
        }
        if(crossDomain && method === 'DELETE' && !httpinvoke.corsDELETE) {
            return failWithoutRequest(cb, new Error('DELETE method in cross-origin requests is not supported in this browser'));
        }
        if(crossDomain && method === 'PUT' && !httpinvoke.corsPUT) {
            return failWithoutRequest(cb, new Error('PUT method in cross-origin requests is not supported in this browser'));
        }
        if(crossDomain && method === 'HEAD' && !httpinvoke.corsHEAD) {
            return failWithoutRequest(cb, new Error('HEAD method in cross-origin requests is not supported in this browser'));
        }
        var xhr = createXHR(crossDomain);
        xhr.open(method, uri, true);
        if(timeout > 0) {
            if(typeof xhr.timeout === 'undefined') {
                setTimeout(function() {
                    cb(new Error('Timeout of ' + timeout + 'ms exceeded'));
                    cb = null;
                }, timeout);
            } else {
                xhr.timeout = timeout;
            }
        }
        if(options.corsCredentials && httpinvoke.corsCredentials && typeof xhr.withCredentials === 'boolean') {
            xhr.withCredentials = true;
        }
        if(crossDomain) {
            // on some Android devices CORS implementations are buggy
            // that is why there needs to be two workarounds:
            // 1. custom header with origin has to be passed, because they do not send Origin header on the actual request
            // 2. caching must be avoided, because of unknown reasons
            // read more: http://www.kinvey.com/blog/107/how-to-build-a-service-that-supports-every-android-browser

            // workaraound for #1: sending origin in custom header, also see the server-side part of the workaround in dummyserver.js
            inputHeaders[corsOriginHeader] = window.location.protocol + '//' + window.location.host;
        }

        /*************** bind XHR event listeners **************/
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
        if(typeof xhr.onloadstart !== 'undefined') {
            xhr.onloadstart = function() {
                onHeadersReceived(false);
            };
        }
        if(typeof xhr.onloadend !== 'undefined') {
            xhr.onloadend = function() {
                onHeadersReceived(false);
            };
        }
        if(typeof xhr.onprogress !== 'undefined') {
            xhr.onprogress = function(progressEvent) {
                if(cb === null) {
                    return;
                }
                onHeadersReceived(false);
                if(statusCb !== null) {
                    return;
                }
                if(typeof progressEvent !== 'undefined') {
                    var total = progressEvent.total || progressEvent.totalSize || 0;
                    var current = progressEvent.loaded || progressEvent.position || 0;
                    if(progressEvent.lengthComputable) {
                        initDownload(total);
                    }
                    if(cb === null) {
                        return;
                    }
                    if(current > total) {
                        // Opera 12 progress events has a bug - .loaded can be higher than .total
                        // see http://dev.opera.com/articles/view/xhr2/#comment-96081222
                        return;
                    }
                    updateDownload(current);
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
            if(!crossDomain || httpinvoke.corsStatus) {
                try {
                    if(typeof xhr.status === 'undefined' || xhr.status === 0) {
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
            }

            outputHeaders = {};
            if(crossDomain) {
                if(httpinvoke.corsResponseContentTypeOnly) {
                    if(typeof xhr.contentType === 'string') {
                        outputHeaders['content-type'] = xhr.contentType;
                    }
                } else {
                    for(var i = 0; i < exposedHeaders.length; i += 1) {
                        try {
                            var header = xhr.getResponseHeader(exposedHeaders[i]);
                            if(header !== null) {
                                outputHeaders[exposedHeaders[i].toLowerCase()] = header;
                            }
                        } catch(err) {
                            if(!lastTry) {
                                return;
                            }
                        }
                    }
                }
            } else {
                try {
                    fillOutputHeaders(xhr, outputHeaders);
                } catch(_) {
                    if(!lastTry) {
                        return;
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

            // BEGIN COMMON
            if(typeof outputHeaders['content-length'] !== 'undefined') {
                initDownload(Number(outputHeaders['content-length']));
                if(cb === null) {
                    return;
                }
            }
            if(method === 'HEAD' || typeof outputHeaders['content-type'] === 'undefined' || outputLength === 0) {
                return noData();
            }
            updateDownload(0);
            // END COMMON
        };
        var onLoad = function() {
            if(cb === null) {
                return;
            }

            if((!crossDomain || httpinvoke.corsStatus) && xhr.status === 0) {
                cb(new Error('"some type" of network error'));
                cb = null;
                return;
            }

            onHeadersReceived(true);
            if(cb === null) {
                return;
            }

            if(typeof xhr.response !== 'undefined' && xhr.response === null) {
                return noData();
            }
            try {
                initDownload(getOutputLength[outputType](xhr));
                if(cb === null) {
                    return;
                }
            } catch(_) {
                return noData();
            }
            if(outputLength === 0) {
                return noData();
            }

            // TODO check whether there is output at all, if no - make output undefined
            // TODO also, any output vs. outputType validation/conversion?
            output = getOutput[outputType](xhr);

            updateDownload(outputLength);
            if(cb === null) {
                return;
            }

            cb(null, output);
            cb = null;
        };
        if(typeof xhr.onreadystatechange !== 'undefined') {
            xhr.onreadystatechange = function() {
                if(xhr.readyState === 2) {
                    // HEADERS_RECEIVED
                    onHeadersReceived(false);
                } else if(xhr.readyState === 3) {
                    // LOADING
                    onHeadersReceived(false);
                    if(statusCb !== null) {
                        return;
                    }
                    try {
                        updateDownload(getOutputLength[outputType](xhr));
                    } catch(err) {
                    }
                } else if(xhr.readyState === 4) {
                    // DONE
                    onLoad();
                }
            };
        }
        xhr.onload = onLoad;

        /*************** set XHR request headers **************/
        if(!crossDomain || httpinvoke.corsRequestHeaders) {
            for(var inputHeaderName in inputHeaders) {
                if(inputHeaders.hasOwnProperty(inputHeaderName)) {
                    xhr.setRequestHeader(inputHeaderName, inputHeaders[inputHeaderName]);
                }
            }
        }

        /*************** invoke XHR request process **************/
        setTimeout(function() {
            if(cb === null) {
                return;
            }
            try {
                xhr.responseType = outputType === 'bytearray' ? 'arraybuffer' : 'text';
            } catch(err) {
            }
            try {
                // must override mime type before receiving headers - at least for Safari 5.0.4
                if(outputType === 'bytearray') {
                    xhr.overrideMimeType('text/plain; charset=x-user-defined');
                } else if(outputType === 'text') {
                    if(outputHeaders['content-type'].substr(0, 'text/'.length) !== 'text/') {
                        xhr.overrideMimeType('text/plain');
                    }
                }
            } catch(err) {
            }
            // Content-Length header is set automatically
            xhr.send(input);
            if(!uploadProgressCbCalled) {
                uploadProgressCbCalled = true;
                uploadProgressCb(0, inputLength);
            }
        }, 0);

        /*************** return "abort" function **************/
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
    httpinvoke.corsResponseContentTypeOnly = false;
    httpinvoke.corsRequestHeaders = false;
    httpinvoke.corsCredentials = false;
    httpinvoke.cors = false;
    httpinvoke.corsDELETE = false;
    httpinvoke.corsHEAD = false;
    httpinvoke.corsPUT = false;
    httpinvoke.corsStatus = false;
    httpinvoke.corsResponseTextOnly = false;
    (function() {
        try {
            createXHR = function() {
                return new window.XMLHttpRequest();
            };
            var tmpxhr = createXHR();
            httpinvoke.cors = 'withCredentials' in tmpxhr;
            if(!httpinvoke.cors) {
                throw '';
            }
            httpinvoke.corsRequestHeaders = true;
            httpinvoke.corsCredentials = true;
            httpinvoke.corsDELETE = true;
            httpinvoke.corsPUT = true;
            httpinvoke.corsHEAD = true;
            httpinvoke.corsStatus = true;
            return;
        } catch(err) {
        }
        try {
            if(typeof XDomainRequest === 'undefined') {
                createXHR = function() {
                    return new window.XMLHttpRequest();
                };
                createXHR();
            } else {
                createXHR = function(cors) {
                    return cors ? new window.XDomainRequest() : new window.XMLHttpRequest();
                };
                createXHR(true);
                httpinvoke.cors = true;
                httpinvoke.corsResponseContentTypeOnly = true;
                httpinvoke.corsResponseTextOnly = true;
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
                    return new window.ActiveXObject(candidates[i]);
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
