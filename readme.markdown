# httpinvoke

httpinvoke is a 4.6kb no-dependencies HTTP client library for **browsers** and **Node.js** with a **promise**-based or Node.js-style callback-based API to **progress events**, text and **binary** file **upload** and **download**, request and response headers, status code.

[Ask a question](https://news.ycombinator.com/item?id=6498905)

* Gracefully upgrades to latest platform-specific features:
  * [cross-origin resource sharing](http://www.w3.org/TR/cors/) - do cross-domain requests with confidence;
  * [progress events](http://www.w3.org/TR/progress-events/) - get current and total bytes downloaded or uploaded;
  * [binary file uploads and downloads](http://www.w3.org/TR/XMLHttpRequest/) - easily use Blob, FormData, ArrayBuffer, Uint8Array or a simple array of bytes.
* Supports both NodeJS style callbacks and [Promises/A+](http://promisesaplus.com/) (with progress events, see [an example](https://github.com/jakutis/httpinvoke/blob/master/test/promise.js)).
* Supports transparent gzip/deflate content decoding.
* Handles HTTP responses The Right Way™:
  * Tries hard to get the HTTP response status code in all cases.
  * Emits the HTTP response status code and headers as soon as they are available.
  * Gives you HTTP status code instead of an error, that is for example HTTP 404 would just return success, with status 404.
  * Throws an error only when the HTTP request did not actually completely finished.
* Well tested - over 277 unit tests.
* Detects the presence of [CommonJS](http://www.commonjs.org/) and [AMD](https://www.google.com/search?q=advanced+module+definition) script loaders.
* Supports [npm](https://npmjs.org/), [Bower](http://bower.io/) and [Component](http://component.io/) package managers.
* Tested on these web browsers:
  * Internet Explorer 6 and later;
  * Firefox 1.5 and later;
  * Chrome 1 and later;
  * Safari 4.0 and later;
  * Opera 10.50 and later;
  * Mobile Safari 7.0.0;
  * Kindle 3.0.0;
  * Android 2.3.7.

## Installation

#### manually

Adding to your HTML file:

    <script src="/path_to_http_invoke/httpinvoke-browser.js"></script>

#### with [npm](https://npmjs.org/package/httpinvoke)

    npm install --save httpinvoke

#### with [Bower](http://bower.io)

    bower install --save httpinvoke

#### with [Component](http://component.io/jakutis/httpinvoke)

    component install jakutis/httpinvoke

## Examples

```javascript
httpinvoke('http://example.org', 'GET', function(err, body, statusCode, headers) {
    if(err) {
        return console.log('Failure', err);
    }
    console.log('Success', body, statusCode, headers);
});

// same as above, but using promise
httpinvoke('http://example.org', 'GET').then(function(res) {
    console.log('Success', res.body, res.statusCode, res.headers);
}, function(err) {
    console.log('Failure', err);
});

// Demonstration of downloading and uploading a file
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

## API

    var abort = httpinvoke(url, method, options, cb)

Any one, two or three arguments can be skipped, except the **url**.

* **abort** is a function for aborting the HTTP request. It is also a [Promise/A+](http://promisesaplus.com/)-compliant promise (has the `then()` method) that receives all the same events as the callbacks - **uploading**, **downloading**, **gotStatus** and **finished** - see [an example](https://github.com/jakutis/httpinvoke/blob/master/test/promiseSpec.js). When invoked as a function, it immediately calls the "finished" callback with an Error. If "finished" callback is already called before the "abort", nothing happens.
* **url** is a string for URL, e.g. `"http://example.org/"`.
* **method** is a string for HTTP method, one of `"HEAD"`, `"GET"`, `"PATCH"`, `"POST"`, `"PUT"`, `"DELETE"`.
* **options** is an object for various options (see the Options section below) or a function, which is used as a "finished" option (see the first example).
* **cb** is a function that is used as an option **finished** (read below).

#### Options

See the Examples section for all the options being used.
All options are optional.

* **timeout** is a number of milliseconds that specifies when **finished** has to be called with an Error if it was not yet called, default is `0`, which means timeout errors are disabled (network stack timeouts result in network errors).
* **uploading** is a function that is called when HTTP request upload progress event happens. It is called with these arguments:
  0. **current** is a number for the number of bytes currently sent;
  0. **total** is a number for the total number of bytes to be sent.
* **downloading** is a function that is called when HTTP response download progress event happens. It is called with these arguments:
  0. **current** is a number for the number of bytes currently received;
  0. **total** is a number for the total number of bytes to be received, or undefined if not known.
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
* **inputType** is a string for the type of the **input** option, one of `"auto"`(default), `"bytearray"`, `"text"` or a custom value that has corresponding **converters**. If not `"auto"`, **input** must be not be undefined.
* **input** must be either one of:
  * undefined (default), if **inputType** is `"auto"` and request **headers** does not have `Content-Type`,
  * a string, if **inputType** is `"text"` or `"auto"`,
  * a bytearray - instance of [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays/ArrayBuffer) or instance of [ArrayBufferView](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays/ArrayBufferView) or instance of [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) or instance of [File](https://developer.mozilla.org/en-US/docs/Web/API/File) or instance of [Buffer](http://nodejs.org/api/buffer.html) or instance of [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) that has elements of type "number" with values ranging from `0` to `255` - if **inputType** is `"bytearray"` or `"auto"`.
* **headers** is an object for HTTP request headers. Keys are header names, values are strings.
* **converters** is an object to convert custom **inputType** and **outputType** values to `"bytearray"` or `"text"`. Example: `{"json text": JSON.stringify, "text json": JSON.parse}`. If you use custom **inputType**, then there must be at least one converter from that type to `"text"` or `"bytearray"`, and the other way around for **outputType**.
* **corsExposedHeaders** is an array of HTTP response headers to be extracted in **gotStatus** call. Default simple headers like "Content-Type" are always extracted. Applicable only for cross-origin requests.
* **corsCredentials** is a boolean for requesting to send credentials. Applicable only for a cross-origin request. See Feature Flags section. Defaults to `false`.
* **corsOriginHeader** is a string for the request header name for browsers with buggy CORS implementations (e.g. Android Browser 2.3.7) - which do not send the Origin request header in actual request. By default **corsOriginHeader** is not set, as it needs a proper `Access-Control-Allow-Headers` server-side header, see `dummyserver.js` for an example of server-side part of the workaround implementation.

#### Error Conditions

The **finished** callback will be called with an instance of Error only when strictly either one of these things happen:

* **abort** function was called (error message "abort");
* sending request failed (error message "upload error");
* sending request timed out (error message "upload timeout");
* native XMLHttpRequest called .onerror without a .status or .statusText (error message "download error") - this can happen due to various network errors, server response sending errors, or simply an unsupported status code - e.g. Firefox 3.0 ends up here after a status 408 response;
* receiving request timed out (error message "download timeout");
* converter from **converters** option threw an error (the thrown error message is passed);
* request did not even start - calling options validation failed or a feature that is not supported by the platform was used (various error messages are passed, e.g. "Unsupported method TRACE").

So generally, finishing with an error means that a response has not been received.
Please note that a request can finish successfully, with an **err** set to `null`, but also with an undefined **status**, undefined **output** and an empty **headers** object - generally **status** is defined at all times, but some older browsers provide status code only for 2XX responses - e.g. Opera 11.50.

#### Callback Sequence

The callbacks are called in this strict sequence:

0. **uploading** (two or more times);
0. **gotStatus** (one time);
0. **downloading** (two or more times);
0. **finished** (one time), except the case that **finished** can be called with Error any time, and then no callbacks will be called.

#### Feature Flags

There are feature flags to be queried for platform-specific features.

    if(httpinvoke.cors) {
        console.log('Cross-Origin Resource Sharing support is available!');
    }

* **requestTextOnly** - **inputType** `"bytearray"` is not supported
* **cors** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) is available
* **corsCredentials** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports sending cookies and HTTP authentication credentials
* **corsResponseContentTypeOnly** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports only Content-Type response header
* **corsRequestHeaders** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports setting request headers
* **corsDELETE** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports `"DELETE"` **method**
* **corsHEAD** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports `"HEAD"` **method**
* **corsPATCH** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports `"PATCH"` **method**
* **corsPUT** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports `"PUT"` **method**
* **corsStatus** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports **status** argument in **gotStatus** option
* **corsResponseTextOnly** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports only **outputType** `"text"`

## Development

To test for NodeJS functionality run `npm run test-node`.

To test for web browser functionality run `npm run test-browser`, copy the URL link that is displayed in console and open it in any web browser.

#### Checklist before releasing

* package.json, bower.json and component.json version number bumped
* file size, number of tests in readme.markdown updated
* httpinvoke-* files regenerated

## License

    The MIT License (MIT)

    Copyright (c) 2013 Vytautas Jakutis <vytautas@jakut.is>

    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    the Software, and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
    FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
    COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
    IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
