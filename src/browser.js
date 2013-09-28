(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.httpinvoke = factory();
  }
}(this, function () {
    var common;
    var bufferSlice = function(buffer, begin, end) {
        if(begin === 0 && end === buffer.byteLength) {
            return buffer;
        }
        if(typeof buffer.slice === 'undefined') {
            return new Uint8Array(Array.prototype.slice.call(new Uint8Array(buffer), begin, end)).buffer;
        } else {
            return buffer.slice(begin, end);
        }
    };
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
                return new Uint8Array(xhr.response === null ? [] : xhr.response);
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

    var parseHeader = function(header) {
        var colon = header.indexOf(':');
        return {
            name: header.slice(0, colon).toLowerCase(),
            value: trim(header.slice(colon + 1))
        };
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
    var createXHR;
    var httpinvoke = function() {
        var c = common.initialize.apply(null, arguments);
        if(typeof c === 'function') {
            return c;
        }
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
        var crossDomain = isCrossDomain(currentLocation, c.uri);
        /*************** start XHR **************/
        if(c.inputType === 'bytearray' && httpinvoke.requestTextOnly) {
            return common.failWithoutRequest(c.cb, new Error('bytearray inputType is not supported on this platform, please always test using requestTextOnly feature flag'));
        }
        if(crossDomain && !httpinvoke.cors) {
            return common.failWithoutRequest(c.cb, new Error('Cross-origin requests are not supported'));
        }
        if(crossDomain && c.method === 'DELETE' && !httpinvoke.corsDELETE) {
            return common.failWithoutRequest(c.cb, new Error('DELETE method in cross-origin requests is not supported in this browser'));
        }
        if(crossDomain && c.method === 'PUT' && !httpinvoke.corsPUT) {
            return common.failWithoutRequest(c.cb, new Error('PUT method in cross-origin requests is not supported in this browser'));
        }
        if(crossDomain && c.method === 'HEAD' && !httpinvoke.corsHEAD) {
            return common.failWithoutRequest(c.cb, new Error('HEAD method in cross-origin requests is not supported in this browser'));
        }
        var xhr = createXHR(crossDomain);
        xhr.open(c.method, c.uri, true);
        if(c.timeout > 0) {
            if(typeof xhr.timeout === 'undefined') {
                setTimeout(function() {
                    c.cb(new Error('Timeout of ' + c.timeout + 'ms exceeded'));
                    c.cb = null;
                }, c.timeout);
            } else {
                xhr.timeout = c.timeout;
            }
        }
        if(c.corsCredentials && httpinvoke.corsCredentials && typeof xhr.withCredentials === 'boolean') {
            xhr.withCredentials = true;
        }
        if(crossDomain) {
            // on some Android devices CORS implementations are buggy
            // that is why there needs to be two workarounds:
            // 1. custom header with origin has to be passed, because they do not send Origin header on the actual request
            // 2. caching must be avoided, because of unknown reasons
            // read more: http://www.kinvey.com/blog/107/how-to-build-a-service-that-supports-every-android-browser

            // workaraound for #1: sending origin in custom header, also see the server-side part of the workaround in dummyserver.js
            c.inputHeaders[c.corsOriginHeader] = window.location.protocol + '//' + window.location.host;
        }

        /*************** bind XHR event listeners **************/
        if(typeof xhr.upload !== 'undefined') {
            xhr.upload.ontimeout = function(progressEvent) {
                if(c.cb === null) {
                    return;
                }
                c.cb(new Error('upload timeout'));
                c.cb = null;
            };
            xhr.upload.onerror = function(progressEvent) {
                if(c.cb === null) {
                    return;
                }
                c.cb(new Error('upload error'));
                c.cb = null;
            };
            xhr.upload.onprogress = function(progressEvent) {
                if(c.cb === null) {
                    return;
                }
                if(progressEvent.lengthComputable) {
                    if(!uploadProgressCbCalled) {
                        uploadProgressCbCalled = true;
                        c.uploadProgressCb(0, c.inputLength);
                    }
                    c.uploadProgressCb(progressEvent.loaded, c.inputLength);
                }
            };
        }

        if(typeof xhr.ontimeout !== 'undefined') {
            xhr.ontimeout = function(progressEvent) {
                if(c.cb === null) {
                    return;
                }
                c.cb(new Error('download timeout'));
                c.cb = null;
            };
        }
        if(typeof xhr.onerror !== 'undefined') {
            xhr.onerror = function() {
                if(c.cb === null) {
                    return;
                }
                c.cb(new Error('download error'));
                c.cb = null;
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
                if(c.cb === null) {
                    return;
                }
                onHeadersReceived(false);
                if(c.statusCb !== null) {
                    return;
                }
                if(typeof progressEvent !== 'undefined') {
                    var total = progressEvent.total || progressEvent.totalSize || 0;
                    var current = progressEvent.loaded || progressEvent.position || 0;
                    if(progressEvent.lengthComputable) {
                        c.initDownload(total);
                    }
                    if(c.cb === null) {
                        return;
                    }
                    if(current > total) {
                        // Opera 12 progress events has a bug - .loaded can be higher than .total
                        // see http://dev.opera.com/articles/view/xhr2/#comment-96081222
                        return;
                    }
                    c.updateDownload(current);
                }
            };
        }
        var onHeadersReceived = function(lastTry) {
            if(c.cb === null) {
                return;
            }

            if(c.statusCb === null) {
                return;
            }
            if(!crossDomain || httpinvoke.corsStatus) {
                try {
                    if(typeof xhr.status === 'undefined' || xhr.status === 0) {
                        return;
                    }
                    c.status = xhr.status;
                } catch(_) {
                    return;
                }
                // sometimes IE returns 1223 when it should be 204
                if(c.status === 1223) {
                    c.status = 204;
                }
            }

            c.outputHeaders = {};
            if(crossDomain) {
                if(httpinvoke.corsResponseContentTypeOnly) {
                    if(typeof xhr.contentType === 'string') {
                        c.outputHeaders['content-type'] = xhr.contentType;
                    }
                } else {
                    for(var i = 0; i < c.exposedHeaders.length; i += 1) {
                        try {
                            var header = xhr.getResponseHeader(c.exposedHeaders[i]);
                            if(header !== null) {
                                c.outputHeaders[c.exposedHeaders[i].toLowerCase()] = header;
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
                    fillOutputHeaders(xhr, c.outputHeaders);
                } catch(_) {
                    if(!lastTry) {
                        return;
                    }
                }
            }

            if(!uploadProgressCbCalled) {
                uploadProgressCbCalled = true;
                c.uploadProgressCb(0, c.inputLength);
            }
            c.uploadProgressCb(c.inputLength, c.inputLength);
            if(c.cb === null) {
                return;
            }

            c.statusCb(c.status, c.outputHeaders);
            c.statusCb = null;
            if(c.cb === null) {
                return;
            }

            c.updateDownload(0);
            if(c.cb === null) {
                return;
            }
            if(typeof c.outputHeaders['content-length'] !== 'undefined') {
                c.initDownload(Number(c.outputHeaders['content-length']));
                if(c.cb === null) {
                    return;
                }
            }
            if(c.method === 'HEAD' || typeof c.outputHeaders['content-type'] === 'undefined') {
                return c.noData();
            }
        };
        var onLoad = function() {
            if(c.cb === null) {
                return;
            }

            if((!crossDomain || httpinvoke.corsStatus) && xhr.status === 0) {
                c.cb(new Error('"some type" of network error'));
                c.cb = null;
                return;
            }

            onHeadersReceived(true);
            if(c.cb === null) {
                return;
            }

            if(typeof c.outputLength === 'undefined') {
                try {
                    c.initDownload(getOutputLength[c.outputType](xhr));
                    if(c.cb === null) {
                        return;
                    }
                } catch(_) {
                    return c.noData();
                }
            }

            c.updateDownload(c.outputLength);
            if(c.cb === null) {
                return;
            }

            try {
                c.cb(null, c.outputConverter(getOutput[c.outputType](xhr)), c.status, c.outputHeaders);
            } catch(err) {
                c.cb(err);
            }
            c.cb = null;
        };
        if(typeof xhr.onreadystatechange !== 'undefined') {
            xhr.onreadystatechange = function() {
                if(xhr.readyState === 2) {
                    // HEADERS_RECEIVED
                    onHeadersReceived(false);
                } else if(xhr.readyState === 3) {
                    // LOADING
                    onHeadersReceived(false);
                    if(c.statusCb !== null) {
                        return;
                    }
                    try {
                        c.updateDownload(getOutputLength[c.outputType](xhr));
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
            for(var inputHeaderName in c.inputHeaders) {
                if(c.inputHeaders.hasOwnProperty(inputHeaderName)) {
                    xhr.setRequestHeader(inputHeaderName, c.inputHeaders[inputHeaderName]);
                }
            }
        }
        /*************** invoke XHR request process **************/
        setTimeout(function() {
            if(c.cb === null) {
                return;
            }
            if(typeof xhr.response === 'undefined') {
                try {
                    // mime type override must be done before receiving headers - at least for Safari 5.0.4
                    if(c.outputType === 'bytearray') {
                        xhr.overrideMimeType('text/plain; charset=x-user-defined');
                    } else if(c.outputType === 'text') {
                        if(c.outputHeaders['content-type'].substr(0, 'text/'.length) !== 'text/') {
                            xhr.overrideMimeType('text/plain');
                        }
                    }
                } catch(err) {
                }
            } else {
                try {
                    xhr.responseType = c.outputType === 'bytearray' ? 'arraybuffer' : 'text';
                } catch(err) {
                }
            }
            // Content-Length header is set automatically
            if(c.inputType === 'bytearray') {
                var triedSendArrayBufferView = false;
                var triedSendBlob = false;
                var triedSendBinaryString = false;

                var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
                if(Object.prototype.toString.call(c.input) === '[object Array]') {
                    if(typeof Uint8Array === 'undefined') {
                        c.input = convertByteArrayToBinaryString(c.input);
                    } else {
                        c.input = new Uint8Array(c.input);
                    }
                }
                var go = function() {
                    var reader, bb;
                    if(triedSendBlob && triedSendArrayBufferView && triedSendBinaryString) {
                        return common.failWithoutRequest(c.cb, new Error('Unable to send'));
                    }
                    if(common.isArrayBufferView(c.input)) {
                        if(triedSendArrayBufferView) {
                            if(!triedSendBinaryString) {
                                try {
                                    c.input = convertByteArrayToBinaryString(new Uint8Array(c.input));
                                } catch(_) {
                                    triedSendBinaryString = true;
                                }
                            } else if(!triedSendBlob) {
                                if(typeof BlobBuilder === 'undefined') {
                                    try {
                                        c.input = new Blob([c.input], {
                                            type: c.inputHeaders['Content-Type']
                                        });
                                    } catch(_) {
                                        triedSendBlob = true;
                                    }
                                } else {
                                    bb = new BlobBuilder();
                                    bb.append(c.input);
                                    c.input = bb.getBlob(c.inputHeaders['Content-Type']);
                                }
                            }
                        } else {
                            try {
                                c.inputLength = c.input.byteLength;
                                if(typeof window.ArrayBufferView === 'undefined') {
                                    xhr.send(bufferSlice(c.input.buffer, c.input.byteOffset, c.input.byteOffset + c.input.byteLength));
                                } else {
                                    xhr.send(c.input);
                                }
                                return;
                            } catch(_) {
                                triedSendArrayBufferView = true;
                            }
                        }
                    } else if(typeof Blob !== 'undefined' && c.input instanceof Blob) {
                        if(triedSendBlob) {
                            if(!triedSendArrayBufferView) {
                                try {
                                    reader = new FileReader();
                                    reader.onerror = function() {
                                        triedSendArrayBufferView = true;
                                        go();
                                    };
                                    reader.onload = function() {
                                        c.input = new Uint8Array(reader.result);
                                        go();
                                    };
                                    reader.readAsArrayBuffer(c.input);
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
                                        c.input = reader.result;
                                        go();
                                    };
                                    reader.readAsBinaryString(c.input);
                                    return;
                                } catch(_) {
                                    triedSendBinaryString = true;
                                }
                            }
                        } else {
                            try {
                                c.inputLength = c.input.size;
                                xhr.send(c.input);
                                return;
                            } catch(_) {
                                triedSendBlob = true;
                            }
                        }
                    } else {
                        if(triedSendBinaryString) {
                            if(!triedSendArrayBufferView) {
                                try {
                                    var a = new ArrayBuffer(c.input.length);
                                    var b = new Uint8Array(a);
                                    for(var i = 0; i < c.input.length; i += 1) {
                                        b[i] = c.input[i] & 0xFF;
                                    }
                                    c.input = b;
                                } catch(_) {
                                    triedSendArrayBufferView = true;
                                }
                            } else if(!triedSendBlob) {
                                if(typeof BlobBuilder === 'undefined') {
                                    try {
                                        c.input = new Blob([c.input], {
                                            type: c.inputHeaders['Content-Type']
                                        });
                                    } catch(_) {
                                        triedSendBlob = true;
                                    }
                                } else {
                                    bb = new BlobBuilder();
                                    bb.append(c.input);
                                    c.input = bb.getBlob(c.inputHeaders['Content-Type']);
                                }
                            }
                        } else {
                            try {
                                c.inputLength = c.input.length;
                                xhr.sendAsBinary(c.input);
                                return;
                            } catch(_) {
                                triedSendBinaryString = true;
                            }
                        }
                    }
                    setTimeout(go, 0);
                };
                go();
            } else if(c.inputType === 'text') {
                c.inputLength = countStringBytes(c.input);
                xhr.send(c.input);
            } else {
                xhr.send(null);
            }
            if(!uploadProgressCbCalled) {
                uploadProgressCbCalled = true;
                c.uploadProgressCb(0, c.inputLength);
            }
        }, 0);

        /*************** return "abort" function **************/
        return function() {
            if(c.cb === null) {
                return;
            }

            // these statements are in case "abort" is called in "finished" callback
            var _cb = c.cb;
            c.cb = null;
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
    httpinvoke.requestTextOnly = false;
    (function() {
        try {
            createXHR = function() {
                return new window.XMLHttpRequest();
            };
            var tmpxhr = createXHR();
            httpinvoke.requestTextOnly = typeof Uint8Array === 'undefined' && typeof tmpxhr.sendAsBinary === 'undefined';
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
