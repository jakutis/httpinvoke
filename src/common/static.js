var resolve = 0, reject = 1, progress = 2, chain = function(a, b) {
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
