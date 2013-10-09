(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.httpinvoke = factory();
  }
}(this, function () {
    var global;
    var pass, isArray, isArrayBufferView, _undefined, nextTick;
    // this could be a simple map, but with this "compression" we save about 100 bytes, if minified (50 bytes, if also gzipped)
    var statusTextToCode = (function() {
        for(var group = arguments.length, map = {};group--;) {
            for(var texts = arguments[group].split(','), index = texts.length;index--;) {
                map[texts[index]] = (group + 1) * 100 + index;
            }
        }
        return map;
    })(
        'Continue,Switching Protocols',
        'OK,Created,Accepted,Non-Authoritative Information,No Content,Reset Content,Partial Content',
        'Multiple Choices,Moved Permanently,Found,See Other,Not Modified,Use Proxy,_,Temporary Redirect',
        'Bad Request,Unauthorized,Payment Required,Forbidden,Not Found,Method Not Allowed,Not Acceptable,Proxy Authentication Required,Request Timeout,Conflict,Gone,Length Required,Precondition Failed,Request Entity Too Large,Request-URI Too Long,Unsupported Media Type,Requested Range Not Satisfiable,Expectation Failed',
        'Internal Server Error,Not Implemented,Bad Gateway,Service Unavailable,Gateway Time-out,HTTP Version Not Supported'
    );
    var bufferSlice = function(buffer, begin, end) {
        if(begin === 0 && end === buffer.byteLength) {
            return buffer;
        }
        return buffer.slice ? buffer.slice(begin, end) : new Uint8Array(Array.prototype.slice.call(new Uint8Array(buffer), begin, end)).buffer;
    };
    var responseBodyToBytes, responseBodyLength;
    try {
        execScript('Function httpinvoke0(B,A)\r\nDim i\r\nFor i=1 to LenB(B)\r\nA.push(AscB(MidB(B,i,1)))\r\nNext\r\nEnd Function\r\nFunction httpinvoke1(B)\r\nhttpinvoke1=LenB(B)\r\nEnd Function', 'vbscript');
        responseBodyToBytes = function(binary) {
            var bytes = [];
            httpinvoke0(binary, bytes);
            return bytes;
        };
        // cannot just assign the function, because httpinvoke1 is not a javascript 'function'
        responseBodyLength = function(binary) {
            return httpinvoke1(binary);
        };
    } catch(err) {
    }
    var getOutputText = function(xhr) {
        return xhr.response || xhr.responseText;
    };
    var binaryStringToByteArray = function(str) {
        for(var n = str.length, bytearray = new Array(n);n--;) {
            bytearray[n] = str.charCodeAt(n) & 255;
        }
        return bytearray;
    };
    var getOutputBinary = function(xhr) {
        if('response' in xhr) {
            return new Uint8Array(xhr.response || []);
        }
        // responseBody must be checked this way, because otherwise
        // it is falsy and then accessing responseText for binary data
        // results in the "c00ce514" error
        if('responseBody' in xhr) {
            return responseBodyToBytes(xhr.responseBody);
        }
        var bytearray = binaryStringToByteArray(xhr.responseText);
        // firefox 4 supports typed arrays but not xhr2
        return global.Uint8Array ? new global.Uint8Array(bytearray) : bytearray;
    };
    var getOutputLengthText = function(xhr) {
        return countStringBytes(getOutputText(xhr));
    };
    var getOutputLengthBinary = function(xhr) {
        if('response' in xhr) {
            return xhr.response ? xhr.response.byteLength : 0;
        }
        // responseBody must be checked this way, because otherwise
        // it is falsy and then accessing responseText for binary data
        // results in the "c00ce514" error
        if('responseBody' in xhr) {
            return responseBodyLength(xhr.responseBody);
        }
        return xhr.responseText.length;
    };

    var countStringBytes = function(string) {
        for(var c, n = 0, i = string.length;i--;) {
            c = string.charCodeAt(i);
            n += c < 128 ? 1 : (c < 2048 ? 2 : 3);
        }
        return n;
    };

    var fillOutputHeaders = function(xhr, outputHeaders) {
        var headers = xhr.getAllResponseHeaders().split(/\r?\n/);
        var atLeastOne = false;
        for(var i = headers.length, colon, header; i--;) {
            if((colon = headers[i].indexOf(':')) >= 0) {
                outputHeaders[headers[i].substr(0, colon).toLowerCase()] = headers[i].substr(colon + 2);
                atLeastOne = true;
            }
        }
        return atLeastOne;
    };

    var urlPartitioningRegExp = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/;
    var isCrossDomain = function(location, uri) {
        uri = urlPartitioningRegExp.exec(uri.toLowerCase());
        location = urlPartitioningRegExp.exec(location.toLowerCase()) || [];
        return !!(uri && (uri[1] !== location[1] || uri[2] !== location[2] || (uri[3] || (uri[1] === 'http:' ? '80' : '443')) !== (location[3] || (location[1] === 'http:' ? '80' : '443'))));
    };
    var createXHR;
    var httpinvoke = function(uri, method, options, cb) {
        var mixInPromise, promise, failWithoutRequest, uploadProgressCb, inputLength, noData, timeout, inputHeaders, statusCb, initDownload, updateDownload, outputHeaders, exposedHeaders, status, outputBinary, input, outputLength, outputConverter;
        /*************** initialize helper variables **************/
        var xhr, i, j, currentLocation, crossDomain, output,
            getOutput = outputBinary ? getOutputBinary : getOutputText,
            getOutputLength = outputBinary ? getOutputLengthBinary : getOutputLengthText,
            uploadProgressCbCalled = false;
        var uploadProgress = function(uploaded) {
            if(!uploadProgressCb) {
                return;
            }
            if(!uploadProgressCbCalled) {
                uploadProgressCbCalled = true;
                uploadProgressCb(0, inputLength);
                if(!cb) {
                    return;
                }
            }
            uploadProgressCb(uploaded, inputLength);
            if(uploaded === inputLength) {
                uploadProgressCb = null;
            }
        };
        try {
            // IE may throw an exception when accessing
            // a field from location if document.domain has been set
            currentLocation = location.href;
        } catch(_) {
            // Use the href attribute of an A element
            // since IE will modify it given document.location
            currentLocation = document.createElement('a');
            currentLocation.href = '';
            currentLocation = currentLocation.href;
        }
        crossDomain = isCrossDomain(currentLocation, uri);
        /*************** start XHR **************/
        if(typeof input === 'object' && httpinvoke.requestTextOnly) {
            return failWithoutRequest(cb, new Error('bytearray inputType is not supported on this platform, please always test using requestTextOnly feature flag'));
        }
        if(crossDomain && !httpinvoke.cors) {
            return failWithoutRequest(cb, new Error('Cross-origin requests are not supported'));
        }
        for(j = ['DELETE', 'PATCH', 'PUT', 'HEAD'], i = j.length;i-- > 0;) {
            if(crossDomain && method === j[i] && !httpinvoke['cors' + j[i]]) {
                return failWithoutRequest(cb, new Error(j[i] + ' method in cross-origin requests is not supported in this browser'));
            }
        }
        if(!createXHR) {
            return failWithoutRequest(cb, new Error('unable to construct XMLHttpRequest object'));
        }
        xhr = createXHR(crossDomain);
        xhr.open(method, uri, true);
        if(timeout > 0) {
            if('timeout' in xhr) {
                xhr.timeout = timeout;
            } else {
                setTimeout(function() {
                    cb(new Error('download timeout'));
                    cb = null;
                }, timeout);
            }
        }
        if(options.corsCredentials && httpinvoke.corsCredentials && typeof xhr.withCredentials === 'boolean') {
            xhr.withCredentials = true;
        }
        if(crossDomain && options.corsOriginHeader) {
            // on some Android devices CORS implementations are buggy
            // that is why there needs to be two workarounds:
            // 1. custom header with origin has to be passed, because they do not send Origin header on the actual request
            // 2. caching must be avoided, because of unknown reasons
            // read more: http://www.kinvey.com/blog/107/how-to-build-a-service-that-supports-every-android-browser

            // workaraound for #1: sending origin in custom header, also see the server-side part of the workaround in dummyserver.js
            inputHeaders[options.corsOriginHeader] = location.protocol + '//' + location.host;
        }

        /*************** bind XHR event listeners **************/
        var makeErrorCb = function(message) {
            return function() {
                // must check, because some callbacks are called synchronously, thus throwing exceptions and breaking code
                if(cb) {
                    cb(new Error(message));
                    cb = null;
                }
            };
        };
        var onuploadprogress = function(progressEvent) {
            if(cb && progressEvent.lengthComputable) {
                uploadProgress(progressEvent.loaded);
            }
        };
        if('upload' in xhr) {
            xhr.upload.ontimeout = makeErrorCb('upload timeout');
            xhr.upload.onerror = makeErrorCb('upload error');
            xhr.upload.onprogress = onuploadprogress;
        } else if('onuploadprogress' in xhr) {
            xhr.onuploadprogress = onuploadprogress;
        }

        if('ontimeout' in xhr) {
            xhr.ontimeout = makeErrorCb('download timeout');
        }
        if('onerror' in xhr) {
            xhr.onerror = function() {
                //inspect('onerror', arguments[0]);
                //dbg('onerror');
                // For 4XX and 5XX response codes Firefox 3.6 cross-origin request ends up here, but has correct statusText, but no status and headers
                onLoad();
            };
        }
        if('onloadstart' in xhr) {
            xhr.onloadstart = function() {
                //dbg('onloadstart');
                onHeadersReceived(false);
            };
        }
        if('onloadend' in xhr) {
            xhr.onloadend = function() {
                //dbg('onloadend');
                onHeadersReceived(false);
            };
        }
        if('onprogress' in xhr) {
            xhr.onprogress = function(progressEvent) {
                //dbg('onprogress');
                if(!cb) {
                    return;
                }
                onHeadersReceived(false);
                if(statusCb) {
                    return;
                }
                // There is a bug in Chrome 10 on 206 response with Content-Range=0-4/12 - total must be 5
                // 'total', 12, 'totalSize', 12, 'loaded', 5, 'position', 5, 'lengthComputable', true, 'status', 206
                // console.log('total', progressEvent.total, 'totalSize', progressEvent.totalSize, 'loaded', progressEvent.loaded, 'position', progressEvent.position, 'lengthComputable', progressEvent.lengthComputable, 'status', status);
                // httpinvoke does not work around this bug, because Chrome 10 is practically not used at all, as Chrome agressively auto-updates itself to latest version
                var total = progressEvent.total || progressEvent.totalSize || 0,
                    current = progressEvent.loaded || progressEvent.position || 0;
                if(progressEvent.lengthComputable) {
                    initDownload(total);
                }
                if(!cb) {
                    return;
                }
                if(current > total) {
                    // Opera 12 progress events has a bug - .loaded can be higher than .total
                    // see http://dev.opera.com/articles/view/xhr2/#comment-96081222
                    return;
                }
                updateDownload(current);
            };
        }
        /*
        var inspect = function(name, obj) {
            return;
            console.log('INSPECT ----- ', name, uri);
            for(var i in obj) {
                try {
                    console.log(name, 'PASS', i, typeof obj[i], typeof obj[i] === 'function' ? '[code]' : obj[i]);
                } catch(_) {
                    console.log(name, 'FAIL', i);
                }
            }
        };
        var dbg = function(name) {
            console.log('DBG ----- ', name, uri);
            inspect('xhr', xhr);
            try {
                console.log('PASS', 'headers', xhr.getAllResponseHeaders());
            } catch(_) {
                console.log('FAIL', 'headers');
            }
            try {
                console.log('PASS', 'cache-control', xhr.getResponseHeader('Cache-Control'));
            } catch(_) {
                console.log('FAIL', 'cache-control');
            }
        };
        */
        var received = {
            success: false,
            status: false,
            entity: false,
            headers: false
        };
        var onHeadersReceived = function(lastTry) {
            if(!cb) {
                return;
            }

            try {
                if(xhr.status) {
                    received.status = true;
                }
            } catch(_) {
            }
            try {
                if(xhr.statusText) {
                    received.status = true;
                }
            } catch(_) {
            }
            try {
                if(xhr.responseText) {
                    received.entity = true;
                }
            } catch(_) {
            }
            try {
                if(xhr.response) {
                    received.entity = true;
                }
            } catch(_) {
            }

            if(!statusCb) {
                return;
            }

            if(received.status || received.entity || received.success || lastTry) {
                if(typeof xhr.contentType === 'string') {
                    if(xhr.contentType !== 'text/html' || xhr.responseText !== '') {
                        // When no entity body and/or no Content-Type header is sent,
                        // XDomainRequest on IE-8 defaults to text/html xhr.contentType.
                        // Also, empty string is not a valid 'text/html' entity.
                        outputHeaders['content-type'] = xhr.contentType;
                        received.headers = true;
                    }
                }
                for(var i = 0; i < exposedHeaders.length; i += 1) {
                    var header;
                    try {
                        if(header = xhr.getResponseHeader(exposedHeaders[i])) {
                            outputHeaders[exposedHeaders[i].toLowerCase()] = header;
                            received.headers = true;
                        }
                    } catch(err) {
                    }
                }
                try {
                    // note - on Opera 11.10 and 11.50 calling getAllResponseHeaders may introduce side effects on xhr and responses will timeout when server responds with some HTTP status codes
                    if(fillOutputHeaders(xhr, outputHeaders)) {
                        received.headers = true;
                    }
                } catch(err) {
                }

                if(!status && (!crossDomain || httpinvoke.corsStatus)) {
                    // Sometimes on IE 9 accessing .status throws an error, but .statusText does not.
                    try {
                        if(xhr.status) {
                            status = xhr.status;
                        }
                    } catch(_) {
                    }
                    if(!status) {
                        try {
                            status = statusTextToCode[xhr.statusText];
                        } catch(_) {
                        }
                    }
                    // sometimes IE returns 1223 when it should be 204
                    if(status === 1223) {
                        status = 204;
                    }
                }
            }

            if(!lastTry && !(received.status && received.headers)) {
                return;
            }

            uploadProgress(inputLength);
            if(!cb) {
                return;
            }

            statusCb(status, outputHeaders);
            statusCb = null;
            if(!cb) {
                return;
            }

            if(method === 'HEAD') {
                return noData();
            }

            updateDownload(0);
            if(!cb) {
                return;
            }

            if('content-length' in outputHeaders && (!crossDomain || 'content-encoding' in outputHeaders) && (!outputHeaders['content-encoding'] || outputHeaders['content-encoding'] === 'identity')) {
                initDownload(Number(outputHeaders['content-length']));
                if(!cb) {
                    return;
                }
            }
        };
        var onLoad = function() {
            if(!cb) {
                return;
            }

            onHeadersReceived(true);
            if(!cb) {
                return;
            }

            if(!received.success && !status) {
                // 'finished in onerror and status code is undefined'
                cb(new Error('download error'));
                cb = null;
                return;
            }

            var length;
            try {
                length = getOutputLength(xhr);
            } catch(_) {
                return noData();
            }
            if(!outputLength) {
                initDownload(length);
            } else if(length !== outputLength) {
                // 'output length ' + outputLength + ' is not equal to actually received entity length ' + length
                cb(new Error('download error'));
                cb = null;
            }
            if(!cb) {
                return;
            }

            updateDownload(outputLength);
            if(!cb) {
                return;
            }

            try {
                cb(null, !received.entity && outputLength === 0 && typeof outputHeaders['content-type'] === 'undefined' ? _undefined : outputConverter(getOutput(xhr)), status, outputHeaders);
            } catch(err) {
                cb(err);
            }
            cb = null;
        };
        var onloadBound = false;
        if(typeof xhr.onload !== 'undefined') {
            onloadBound = true;
            xhr.onload = function() {
                received.success = true;
                //dbg('onload');
                onLoad();
            };
        }
        if(typeof xhr.onreadystatechange !== 'undefined') {
            xhr.onreadystatechange = function() {
                //dbg('onreadystatechange ' + xhr.readyState);
                if(xhr.readyState === 2) {
                    // HEADERS_RECEIVED
                    onHeadersReceived(false);
                } else if(xhr.readyState === 3) {
                    // LOADING
                    received.success = true;
                    onHeadersReceived(false);
                    if(statusCb) {
                        return;
                    }
                    try {
                        updateDownload(getOutputLength(xhr));
                    } catch(err) {
                    }
                // Instead of 'typeof xhr.onload === "undefined"', we must use
                // onloadBound variable, because otherwise Firefox 3.5 synchronously
                // throws a "Permission denied for <> to create wrapper for
                // object of class UnnamedClass" error
                } else if(xhr.readyState === 4 && !onloadBound) {
                    // DONE
                    onLoad();
                }
            };
        }

        /*************** set XHR request headers **************/
        if(!crossDomain || httpinvoke.corsRequestHeaders) {
            for(var inputHeaderName in inputHeaders) {
                if(inputHeaders.hasOwnProperty(inputHeaderName)) {
                    try {
                        xhr.setRequestHeader(inputHeaderName, inputHeaders[inputHeaderName]);
                    } catch(err) {
                        return failWithoutRequest(cb, err);
                    }
                }
            }
        }
        /*************** invoke XHR request process **************/
        nextTick(function() {
            if(!cb) {
                return;
            }
            if('response' in xhr) {
                try {
                    xhr.responseType = outputBinary ? 'arraybuffer' : 'text';
                } catch(err) {
                }
            } else {
                try {
                    // mime type override must be done before receiving headers - at least for Safari 5.0.4
                    if(outputBinary) {
                        xhr.overrideMimeType('text/plain; charset=x-user-defined');
                    }
                } catch(err) {
                }
            }
            if(typeof input === 'object') {
                var triedSendArrayBufferView = false;
                var triedSendBlob = false;
                var triedSendBinaryString = false;

                var BlobBuilder = global.BlobBuilder || global.WebKitBlobBuilder || global.MozBlobBuilder || global.MSBlobBuilder;
                if(isArray(input)) {
                    input = global.Uint8Array ? new Uint8Array(input) : String.fromCharCode.apply(String, input);
                }
                var toBlob = BlobBuilder ? function() {
                    var bb = new BlobBuilder();
                    bb.append(input);
                    input = bb.getBlob(inputHeaders['Content-Type'] || 'application/octet-stream');
                } : function() {
                    try {
                        input = new Blob([input], {
                            type: inputHeaders['Content-Type'] || 'application/octet-stream'
                        });
                    } catch(_) {
                        triedSendBlob = true;
                    }
                };
                var go = function() {
                    var reader;
                    if(triedSendBlob && triedSendArrayBufferView && triedSendBinaryString) {
                        return failWithoutRequest(cb, new Error('Unable to send'));
                    }
                    if(isArrayBufferView(input)) {
                        if(triedSendArrayBufferView) {
                            if(!triedSendBinaryString) {
                                try {
                                    input = String.fromCharCode.apply(String, input);
                                } catch(_) {
                                    triedSendBinaryString = true;
                                }
                            } else if(!triedSendBlob) {
                                toBlob();
                            }
                        } else {
                            try {
                                inputLength = input.byteLength;
                                // if there is ArrayBufferView, then the browser supports sending instances of subclasses of ArayBufferView, otherwise we must send an ArrayBuffer
                                xhr.send(global.ArrayBufferView ? input : bufferSlice(input.buffer, input.byteOffset, input.byteOffset + input.byteLength));
                                return;
                            } catch(_) {
                                triedSendArrayBufferView = true;
                            }
                        }
                    } else if(global.Blob && input instanceof Blob) {
                        if(triedSendBlob) {
                            if(!triedSendArrayBufferView) {
                                try {
                                    reader = new FileReader();
                                    reader.onerror = function() {
                                        triedSendArrayBufferView = true;
                                        go();
                                    };
                                    reader.onload = function() {
                                        try {
                                            input = new Uint8Array(reader.result);
                                        } catch(_) {
                                            triedSendArrayBufferView = true;
                                        }
                                        go();
                                    };
                                    reader.readAsArrayBuffer(input);
                                    return;
                                } catch(_) {
                                    triedSendArrayBufferView = true;
                                }
                            } else if(!triedSendBinaryString) {
                                try {
                                    reader = new FileReader();
                                    reader.onerror = function() {
                                        triedSendBinaryString = true;
                                        go();
                                    };
                                    reader.onload = function() {
                                        input = reader.result;
                                        go();
                                    };
                                    reader.readAsBinaryString(input);
                                    return;
                                } catch(_) {
                                    triedSendBinaryString = true;
                                }
                            }
                        } else {
                            try {
                                inputLength = input.size;
                                xhr.send(input);
                                return;
                            } catch(_) {
                                triedSendBlob = true;
                            }
                        }
                    } else {
                        if(triedSendBinaryString) {
                            if(!triedSendArrayBufferView) {
                                try {
                                    input = binaryStringToByteArray(input);
                                } catch(_) {
                                    triedSendArrayBufferView = true;
                                }
                            } else if(!triedSendBlob) {
                                toBlob();
                            }
                        } else {
                            try {
                                inputLength = input.length;
                                xhr.sendAsBinary(input);
                                return;
                            } catch(_) {
                                triedSendBinaryString = true;
                            }
                        }
                    }
                    nextTick(go);
                };
                go();
            } else {
                try {
                    if(typeof input === 'string') {
                        inputLength = countStringBytes(input);
                        xhr.send(input);
                    } else {
                        xhr.send(null);
                    }
                } catch(err) {
                    var _cb = cb;
                    cb = null;
                    return failWithoutRequest(cb, new Error('Unable to send'));
                }
            }
            uploadProgress(0);
        });

        /*************** return "abort" function **************/
        promise = function() {
            if(!cb) {
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
        return mixInPromise(promise);
    };
    httpinvoke.corsResponseContentTypeOnly = false;
    httpinvoke.corsRequestHeaders = false;
    httpinvoke.corsCredentials = false;
    httpinvoke.cors = false;
    httpinvoke.corsDELETE = false;
    httpinvoke.corsHEAD = false;
    httpinvoke.corsPATCH = false;
    httpinvoke.corsPUT = false;
    httpinvoke.corsStatus = false;
    httpinvoke.corsResponseTextOnly = false;
    httpinvoke.requestTextOnly = false;
    (function() {
        try {
            createXHR = function() {
                return new XMLHttpRequest();
            };
            var tmpxhr = createXHR();
            httpinvoke.requestTextOnly = typeof Uint8Array === 'undefined' && typeof tmpxhr.sendAsBinary === 'undefined';
            httpinvoke.cors = 'withCredentials' in tmpxhr;
            if(httpinvoke.cors) {
                httpinvoke.corsRequestHeaders = true;
                httpinvoke.corsCredentials = true;
                httpinvoke.corsDELETE = true;
                httpinvoke.corsPATCH = true;
                httpinvoke.corsPUT = true;
                httpinvoke.corsHEAD = true;
                httpinvoke.corsStatus = true;
                return;
            }
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
        for(var i = candidates.length; i--;) {
            try {
                createXHR = function() {
                    return new ActiveXObject(candidates[i]);
                };
                createXHR();
                httpinvoke.requestTextOnly = true;
                return;
            } catch(err) {
            }
            i -= 1;
        }
        createXHR = _undefined;
    })();

    return httpinvoke;
}));
