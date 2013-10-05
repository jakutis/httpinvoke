var isArrayBufferView = function(input) {
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
}, isArray = function(object) {
    return Object.prototype.toString.call(object) === '[object Array]';
}, isByteArray = function(input) {
    return typeof input === 'object' && input !== null && (
        (global.Buffer && input instanceof Buffer) ||
        (global.Blob && input instanceof Blob) ||
        (global.File && input instanceof File) ||
        (global.ArrayBuffer && input instanceof ArrayBuffer) ||
        isArrayBufferView(input) ||
        isArray(input)
    );
}, bytearrayMessage = 'an instance of Buffer, nor Blob, nor File, nor ArrayBuffer, nor ArrayBufferView, nor Int8Array, nor Uint8Array, nor Uint8ClampedArray, nor Int16Array, nor Uint16Array, nor Int32Array, nor Uint32Array, nor Float32Array, nor Float64Array, nor Array', supportedMethods = ',GET,HEAD,PATCH,POST,PUT,DELETE,', pass = function(value) {
    return value;
}, nextTick = (global.process && global.process.nextTick) || global.setImmediate || global.setTimeout, _undefined;
