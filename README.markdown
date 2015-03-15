# httpinvoke

A no-dependencies HTTP client library for browsers and Node.js with a promise-based or Node.js-style callback-based API to progress events, text and binary file upload and download, partial response body, request and response headers, status code.

- [Ask a question](https://news.ycombinator.com/item?id=6498905)
- [See a basic demo](https://jakut.is/httpinvoke)

[![Build Status](https://travis-ci.org/jakutis/httpinvoke.png?branch=master)](https://travis-ci.org/jakutis/httpinvoke)

- [Overview](#overview)
- [Installation](#installation)
- [Examples](#examples)
  - [Basic](#basic)
  - [Basic with Promises](#basic-with-promises)
  - [Promises and partial progress](#promises-and-partial-progress)
  - [Downloading and uploading a file](#downloading-and-uploading-a-file)
  - [Uploading an HTML form](#uploading-an-html-form)
  - [Streaming JSON](#streaming-json)
- [API](#api)
  - [options](#options)
  - [callback sequence](#callback-sequence)
  - [static methods](#static-methods)
  - [feature flags](#feature-flags)
  - [error conditions](#error-conditions)
  - [error codes](#error-codes)
- [Development](#development)

## Overview

* Gracefully upgrades to latest platform-specific features:
  * [cross-origin resource sharing](http://www.w3.org/TR/cors/) - do cross-domain requests with confidence;
  * [streaming](http://www.w3.org/TR/streams-api/) - currently only streaming downloads, see [description of option **partialOutputMode** below](#options).
  * [progress events](http://www.w3.org/TR/progress-events/) - get current and total bytes downloaded or uploaded;
  * [binary file uploads and downloads](http://www.w3.org/TR/XMLHttpRequest/) - easily use Blob, FormData, ArrayBuffer, Uint8Array or a simple array of bytes;
* Supports both NodeJS style callbacks and [Promises/A+](http://promisesaplus.com/) (with progress events, see [an example](https://github.com/jakutis/httpinvoke/blob/master/test/promise.js)).
* Supports transparent gzip/deflate content decoding.
* Handles HTTP responses The Right Way™:
  * Tries hard to get the HTTP response status code in all cases.
  * Emits the HTTP response status code and headers as soon as they are available.
  * Gives you HTTP status code instead of an error, that is for example HTTP 404 would just return success, with status 404.
  * Throws an error only when the HTTP request did not actually completely finished.
* Well tested - over 600 acceptance tests.
* Detects the presence of [CommonJS](http://www.commonjs.org/) and [AMD](https://www.google.com/search?q=advanced+module+definition) script loaders.
* Supports [npm](https://npmjs.org/), [Bower](http://bower.io/) and [Component](http://component.io/) package managers.
* Tested on these web browsers:
  * Internet Explorer 6 and later;
  * Firefox 3.0 and later;
  * Chrome 1 and later;
  * Safari 4.0 and later;
  * Opera 10.60 and later;
  * Android 2.3.3 and later;
  * Kindle 3.0 (Version/4.0);
  * Samsung Smart-TV 4.5 (Webkit/537.42 Chromium/25.0).
* Tested on these Node versions:
  * 0.8;
  * 0.10;
  * 0.11;
  * 0.12.

## Installation

  Install manually by adding to your HTML file:

    <script src="/path/to/httpinvoke/httpinvoke-browser.js"></script>

  Install with [npm](https://www.npmjs.org/package/httpinvoke):

    $ npm install --save httpinvoke

  Install with [component](http://component.io/jakutis/httpinvoke):

    $ component install jakutis/httpinvoke

  Install with [bower](http://bower.io):

    $ bower install --save httpinvoke

## Examples

### Basic

```javascript
var httpinvoke = require('httpinvoke');

httpinvoke('http://example.org', 'GET', function(err, body, statusCode, headers) {
    if(err) {
        return console.log('Failure', err);
    }
    console.log('Success', body, statusCode, headers);
});
```

### Basic with Promises

```javascript
var httpinvoke = require('httpinvoke');

httpinvoke('http://example.org', 'GET').then(function(res) {
    console.log('Success', res.body, res.statusCode, res.headers);
}, function(err) {
    console.log('Failure', err);
});
```

### Promises and partial progress

```javascript
httpinvoke('http://example.org', {
    partialOutputMode: 'chunked',
    outputType: 'bytearray'
}).then(function(res) {
    console.log('Success', res.body, res.statusCode, res.headers);
}, function(err) {
    console.log('Error occurred', err);
}, function(progress) {
    if(progress.type === 'upload') {
        // total and current are always defined
        console.log('progress: ' + (progress.total - progress.current) + ' bytes left to upload');
    } else if(progress.type === 'download') {
        var partialinfo = ' (received chunk of ' + progress.partial.length + ' bytes)';
        if(typeof progress.total === 'undefined') {
            console.log('progress: ' + progress.current + ' bytes downloaded' + partialinfo);
        } else {
            console.log('progress: ' + (progress.total - progress.current) + ' bytes left to download' + partialinfo);
        }
    } else if(progress.type === 'headers') {
        console.log('progress: received response with status code ' + progress.statusCode + ' and headers: ', progress.headers);
    }
});
```

### Uploading an HTML form

```javascript
var httpinvoke = require('httpinvoke');

var book = {
    content: 'Hello World',
    comment: 'initial version'
};
// convert the json object to application/x-www-form-urlencoded format string
var encodedBook = Object.keys(book).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(book[key]);
}).join('&');
// upload to server
httpinvoke('http://example.org', 'POST', {
    headers: {
        // remove this header if doing a cross-domain request
        // or add a 'Content-Type' to 'Access-Control-Allow-Headers' server-side response header
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    input: encodedBook
}, function(err) {
    if(err) {
        return console.log('Failure', err);
    }
    console.log('Success');
});
```

### Downloading and uploading a file

```javascript
var httpinvoke = require('httpinvoke');

var converters = {
    'text json': JSON.parse,
    'json text': JSON.stringify
};
httpinvoke('https://bower-component-list.herokuapp.com/', 'GET', {
    outputType: 'json',
    converters: converters
}).then(function(response) {
    console.log('There are ' + response.body.length + ' bower packages.');
    return httpinvoke('http://server.cors-api.appspot.com/server?id=9285649&enable=true&status=200&credentials=false&methods=POST', 'POST', {
        input: response.body,
        inputType: 'json',
        converters: converters
    });
}, function(err) {
    console.log('Error receiving package list', err);
}, function(progress) {
    console.log('Receiving package list progress', progress);
}).then(function(response) {
    console.log('Uploading finished', response);
}, function(err) {
    console.log('Error sending package list', err);
}, function(progress) {
    console.log('Sending package list progress', progress);
});
```

### Streaming JSON

```javascript
var clarinet = require('clarinet');
var httpinvoke = require('httpinvoke');

var parser = clarinet.parser();
var lastKey = null;
parser.onvalue = function(v) {
    if(lastKey === 'name') {
        console.log('component', v);
    }
};
parser.onopenobject = function(key) {
    lastKey = key;
};
parser.onkey = function(key) {
    lastKey = key;
};
// try with slow internet connection
httpinvoke('https://bower-component-list.herokuapp.com/', {
    partialOutputMode: 'chunked'
}).then(function(res) {
    parser.close();
    console.log('OK, in total there are ' + JSON.parse(res.body).length + ' bower components');
}, function(err) {
    console.log('Error occurred', err);
}, function(progress) {
    if(progress.type === 'download') {
        console.log('received chunk of length=' + progress.partial.length);
        parser.write(progress.partial);
    }
});
```

## API

    var abort = httpinvoke(url, method, options, cb)

Any one, two or three arguments can be skipped, except the **url**.

* **abort** is a function for aborting the HTTP request. It is also a [Promise/A+](http://promisesaplus.com/)-compliant promise (has the `then()` method) that receives all the same events as the callbacks - **uploading**, **downloading**, **gotStatus** and **finished** - see [an example](#basic-with-promises). When invoked as a function, it immediately calls the "finished" callback with an Error. If "finished" callback is already called before the "abort", nothing happens.
* **url** is a string for URL, e.g. `"http://example.org/"`.
* **method** is a string for HTTP method, one of `"HEAD"`, `"GET"`, `"PATCH"`, `"POST"`, `"PUT"`, `"DELETE"`.
* **options** is an object for various options (see the Options section below) or a function, which is used as a "finished" option (see the first example).
* **cb** is a function that is used as an option **finished** (read below).

#### Options

See the Examples section for all the options being used.
All options are optional.

* **partialOutputMode** is a string for the type of the **partial** argument of the **downloading** option, one of `"disabled"` (default, **downloading** will not receive the **partial** argument), `"chunked"` (the received value will be the latest chunk), `"joined"` (the received value will be the entire partial body).
* **anonymous** - is a boolean for requesting to not send [user credentials](http://www.w3.org/TR/XMLHttpRequest/#user-credentials). Applicable only when **anonymousOption** feature flag is `true`. Defaults to the value of **anonymousByDefault** feature flag. If specified, and `false`, then overrides **corsCredentials** (makes it `true`).
* **system** - is a boolean for requesting to not enforce [same origin policy](http://www.w3.org/Security/wiki/Same_Origin_Policy). Applicable only when **systemOption** feature flag is `true`. Defaults to the value of **systemByDefault** feature flag. If specified, and `true`, then overrides **anonymous** (makes it `true`).
* **timeout** must be either one of:
  * undefined (default), means that **finished** must never be called with any of the timeout errors,
  * a number (greater than 0 and less than 1073741824) for maximum duration in milliseconds between the httpinvoke call and **finished** call, if it timeouts - **finished** must be called with `"timeout"` error,
  * an instance of [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) (if **corsFineGrainedTimeouts** feature is not supported and **url** is cross-origin then **timeout** is assigned to the sum of this array) with elements:
    0. a number (greater than 0 and less than 1073741824) for maximum duration in milliseconds between the httpinvoke call and **gotStatus** call, if it timeouts - **finished** must be called with `"upload timeout"` error;
    0. a number (greater than 0 and less than 1073741824) for maximum duration in milliseconds between **gotStatus** call and **finished** call, if it timeouts - **finished** must be called with `"download timeout"` error.
* **uploading** is a function that is called when HTTP request upload progress event happens. It is called with these arguments:
  0. **current** is a number for the number of bytes currently sent;
  0. **total** is a number for the total number of bytes to be sent.
* **downloading** is a function that is called when HTTP response download progress event happens. It is called with these arguments:
  0. **current** is a number for the number of bytes currently received;
  0. **total** is a number for the total number of bytes to be received, or undefined if not known.
  0. **partial** is a string (or bytearray, if either **outputType** is `"bytearray"` or a custom **outputType** will be converted from bytearray), or undefined if **partialOutputMode** option is set to `"disabled"`.
* **gotStatus** is a function that is called when HTTP response headers are received. It is called with these arguments:
  0. **status** is a number for an HTTP response status code, either undefined, or a correct value.
  0. **headers** is an object for HTTP response headers. Keys are lower-cased header names, values are strings.
* **finished** is a function that is called when HTTP response is fully downloaded, or any error happens. It is called with these arguments:
  0. **err** is null or an object that is an instance of Error, **please read error conditions section below**;
  0. **output** is:
      * undefined, if err is not null or no response entity has been received (e.g. when **method** is `"HEAD"`),
      * a string, if **outputType** is `"text"`,
      * a bytearray - instance of [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays/Uint8Array) or instance of [Buffer](http://nodejs.org/api/buffer.html) or instance of [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) that has elements of type "number" with values ranging from `0` to `255` - if **outputType** is `"bytearray"`,
      * any value - if **outputType** is neither `"bytearray"`, nor `"text"`, i.e. a converter has been called.
  0. **status** is:
      * undefined, if err is not null or no correct value is available,
      * otherwise, a number for an HTTP response status code, correct value.
  0. **headers** is:
      * undefined, if err is not null,
      * otherwise, an object for HTTP response headers. Keys are lower-cased header names, values are strings.
* **outputType** is a string for the type of the **output** argument of the **finished** option, one of `"text"` (default), `"bytearray"` or a custom value that has corresponding **converters**.
* **inputType** is a string for the type of the **input** option, one of `"auto"`(default), `"bytearray"`, `"text"`, `"formdata"` or a custom value that has corresponding **converters**. If not `"auto"`, **input** must be not be undefined.
* **input** must be either one of:
  * undefined (default), if **inputType** is `"auto"` and request **headers** does not have `Content-Type`,
  * a string, if **inputType** is `"text"` or `"auto"`,
  * a bytearray - instance of [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays/ArrayBuffer) or instance of [ArrayBufferView](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays/ArrayBufferView) or instance of [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) or instance of [File](https://developer.mozilla.org/en-US/docs/Web/API/File) or instance of [Buffer](http://nodejs.org/api/buffer.html) or instance of [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) that has elements of type "number" with values ranging from `0` to `255` - if **inputType** is `"bytearray"` or `"auto"`.
  * an instance of [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) - if **inputType** is `"formdata"` or `"auto"`,
* **headers** is an object for HTTP request headers. Keys are header names, values are strings.
* **converters** is an object to convert custom **inputType** and **outputType** values to `"bytearray"` or `"text"`. Example: `{"json text": JSON.stringify, "text json": JSON.parse}`. If you use custom **inputType**, then there must be at least one converter from that type to `"text"` or `"bytearray"`, and the other way around for **outputType**.
* **corsExposedHeaders** is an array of HTTP response headers to be extracted in **gotStatus** call. Default simple headers like "Content-Type" are always extracted. Applicable only for cross-origin requests.
* **corsCredentials** is a boolean for requesting to send credentials. Applicable only for a cross-origin request. See Feature Flags section. Defaults to `false`.
* **corsOriginHeader** is a string for the request header name for browsers with buggy CORS implementations (e.g. Android Browser 2.3.7) - which do not send the Origin request header in actual request. By default **corsOriginHeader** is not set, as it needs a proper `Access-Control-Allow-Headers` server-side header, see `dummyserver.js` for an example of server-side part of the workaround implementation.

#### Callback Sequence

The callbacks are called in this strict sequence:

0. **uploading** (two or more times);
0. **gotStatus** (one time);
0. **downloading** (two or more times);
0. **finished** (one time), except the case that **finished** can be called with Error any time, and then no callbacks will be called.

#### Static Methods

##### .hook(type, hook)

**hook** is a function to hook into how httpinvoke works.
It leaves the current instance of httpinvoke untouched.
It returns a new instance of httpinvoke with a new hook, and all the hooks inherited from the old httpinvoke.
It takes these arguments:

* **type** - a string, one of 'uploading', 'gotStatus', 'downloading', 'finished'
* **hook** - a function that is called with arguments in accordance with what type defines. It must return an array of the same (or modified) arguments which is passed to the next hook that is added after the current (of the same type).

```javascript
// a new httpinvoke with a hook to fail on 4xx and 5xx statuses, just like jQuery
httpinvoke = httpinvoke.hook('finished', function(err, output, statusCode, headers) {
    if(err) {
        return arguments;
    }
    if(typeof statusCode === 'undefined') {
        return [new Error('Server or client error - undefined HTTP status'), output, statusCode, headers];
    }
    if(statusCode >= 400 && statusCode <= 599) {
        return [new Error('Server or client error - HTTP status ' + statusCode), output, statusCode, headers];
    }
    return arguments;
});

// err will be set; output, status, headers are unchanged
httpinvoke('http://example.org/foobar', function(err, output, statusCode, headers) {
    console.log(err, output, statusCode, headers);
});

// will be rejected (prints 'Failure with status=404')
httpinvoke('http://example.org/foobar').then(function(res) {
    console.log('Success', res.body, res.statusCode, res.headers);
}, function(err, res) {
    console.log('Failure with status=', res.statusCode);
});
```

#### Feature Flags

There are feature flags to be queried for platform-specific features.

    if(httpinvoke.cors) {
        console.log('Cross-Origin Resource Sharing support is available!');
    }

* **requestTextOnly** - **inputType** `"bytearray"` is not supported (though `"formdata"` may be supported, check for window.FormData constructor on your browser)
* **PATCH** - `"PATCH"` **method** is supported
* **cors** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) is available
* **corsCredentials** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports sending [user credentials](http://www.w3.org/TR/XMLHttpRequest/#user-credentials)
* **corsResponseContentTypeOnly** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports only Content-Type response header
* **corsRequestHeaders** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports setting request headers
* **corsDELETE** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports `"DELETE"` **method**
* **corsHEAD** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports `"HEAD"` **method**
* **corsPATCH** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports `"PATCH"` **method**
* **corsPUT** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports `"PUT"` **method**
* **corsStatus** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports **status** argument in **gotStatus** option
* **corsResponseTextOnly** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports only **outputType** `"text"`
* **corsFineGrainedTimeouts** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports "upload timeout" and "download timeout" errors.
* **anyMethod** - any standard or custom HTTP method can be used, as opposed to just GET, HEAD, PATCH, POST, PUT or DELETE
* **forbiddenInputHeaders** - array of lower-cased names of request headers that will result in finish with error if any one is found in **headers** option
* **relativeURLs** - relative URLs (e.g. `"/foo"`, `"./bar"`, `"foobar"`) and protocol-relative URLs (e.g. `"//example.org/foo"`) are supported
* **anonymousByDefault** - [user credentials](http://www.w3.org/TR/XMLHttpRequest/#user-credentials) are sent by default
* **anonymousOption** - controlling (e.g. via [mozAnon](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Parameters_(non-standard))) whether [user credentials](http://www.w3.org/TR/XMLHttpRequest/#user-credentials) are sent is supported (i.e. whether specifying the option **anonymous** has any effect)
* **systemByDefault** - [same origin policy](http://www.w3.org/Security/wiki/Same_Origin_Policy) is enforced by default (cross-origin requests are implemented using the [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) mechanism)
* **systemOption** - controlling (e.g. via [mozSystem](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Parameters_(non-standard))) whether [same origin policy](http://www.w3.org/Security/wiki/Same_Origin_Policy) is enforced is supported (i.e. whether specifying the option **system** has any effect)

#### Error Conditions

The **finished** callback will be called with an instance of Error only when strictly either one of these things happen:

* **abort** function was called (error message `"abort"`);
* number of received bytes does not equal the Content-Type value or native XMLHttpRequest called .onerror without a .status or .statusText (error message `"network error"`) - this can happen due to various network errors, server response sending or request receiving errors, or simply an unsupported status code - e.g. Firefox 3.0 ends up here after a status 408 response;
* sending request timed out (error message `"upload timeout"`);
* receiving response timed out (error message `"download timeout"`);
* sending request and receiving response timed out (error message `"timeout"`);
* converter from **converters** option threw an error (the thrown error message is passed);
* request did not even start (error message `"Error code #%. See https://github.com/jakutis/httpinvoke#error-codes"`)  - calling options validation failed or a feature that is not supported by the platform was used (various error messages are passed, e.g. "Unsupported method TRACE"). See [error codes](#error-codes).

So generally, finishing with an error means that a response has not been received.
Please note that a request can finish successfully, with an **err** set to `null`, but also with an undefined **status**, undefined **output** and an empty **headers** object - generally **status** is defined at all times, but some older browsers provide status code only for 2XX responses - e.g. Opera 11.50.

#### Error Codes

* **001** Option % is less than zero
* **002** Option % is not a number
* **003** Option "partialOutputMode" is neither "disabled", nor "chunked", nor "joined"
* **004** Unsupported method %
* **005** Unsupported outputType %
* **006** "inputType" is undefined or auto and input is neither string, nor FormData, nor an instance of Buffer, nor Blob, nor File, nor ArrayBuffer, nor ArrayBufferView, nor Int8Array, nor Uint8Array, nor Uint8ClampedArray, nor Int16Array, nor Uint16Array, nor Int32Array, nor Uint32Array, nor Float32Array, nor Float64Array, nor Array
* **007** "inputType" is text, but input is not a string
* **008** "inputType" is formdata, but input is not an instance of FormData
* **009** "inputType" is bytearray, but input is neither an instance of Buffer, nor Blob, nor File, nor ArrayBuffer, nor ArrayBufferView, nor Int8Array, nor Uint8Array, nor Uint8ClampedArray, nor Int16Array, nor Uint16Array, nor Int32Array, nor Uint32Array, nor Float32Array, nor Float64Array, nor Array
* **010** There is no converter for specified "inputType" %
* **011** "input" is undefined, but "inputType" is defined
* **012** "input" is undefined, but "Content-Type" input header is defined
* **013** "timeout" value is not valid
* **014** Input header % is forbidden to be set programmatically
* **015** Input header % (to be precise, all Proxy-*) is forbidden to be set programmatically
* **016** Input header % (to be precise, all Sec-*) is forbidden to be set programmatically
* **017** bytearray inputType is not supported on this platform, please always test using requestTextOnly feature flag - hint - you may want to try sending FormData (formdata type)
* **018** Cross-origin requests are not supported in this browser
* **019** % method cross-origin requests are not supported in this browser
* **020** PATCH method requests are not supported in this browser
* **021** Unable to construct XMLHttpRequest object
* **022** Unable to open uri %
* **023** Unable to set input header %
* **024** Unable to send
* **025** "%" protocol is not among these supported protocols: http, https
* **026** Given URL "%" is relative, but **relativeURLs** flag is false

## Development

After cloning the repo, and on each modification of `src` folder, you have to run `npm run compile`.

To test for NodeJS functionality run `npm run test-node`.

To test for web browser functionality run `npm run test-browser`, copy the URL link that is displayed in console and open it in any web browser.

#### Checklist before releasing

* `npm test`
* tests pass on the browser versions indicated in [overview](#overview).
* package.json, bower.json and component.json version number bumped
* `npm run compile`
* `release X.X.X` commit created and tagged as `X.X.X`
* `npm publish`
