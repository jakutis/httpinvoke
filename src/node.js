var parseURL = require('url').parse;
var zlib = require('zlib');
var protocolImplementations = {
    http: require('http'),
    https: require('https')
};

/* jshint unused:true */
var addHook, initHooks, mixInPromise, pass, isArray, isArrayBufferView, _undefined, nextTick, isFormData, absoluteURLRegExp;
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
    var hook, promise, failWithoutRequest, uploadProgressCb, downloadProgressCb, inputLength, inputHeaders, statusCb, outputHeaders, exposedHeaders, status, outputBinary, input, outputLength, outputConverter, partialOutputMode, protocol, anonymous, system;
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
