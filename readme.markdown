# httpinvoke

HTTP client for JavaScript. [Check out the demo.](http://jakut.is:1337/)

* Sends requests and receives responses.
* Gracefully upgrades to latest platform-specific features:
  * [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
  * [progress events](http://www.w3.org/TR/progress-events/)
* Works on [web browser](http://en.wikipedia.org/wiki/Internet_Explorer_5) and [Node.js](http://nodejs.org) platforms.
* Detects the presence of [CommonJS](http://www.commonjs.org/) and [AMD](https://www.google.com/search?q=advanced+module+definition) script loaders.
* Available on [npm](https://npmjs.org/package/httpinvoke) and [GitHub](https://github.com/jakutis/httpinvoke).
* Supports [npm](https://npmjs.org/), [Bower](http://bower.io/) and [Component](http://component.io/) package managers.
* Tested on:
  * IE 7.0.0 and later
  * Firefox 3.0.0 and later
  * Chrome 1.0.154 and later
  * Safari 4.0.3 and later
  * Opera 10.50.0 and later
  * Mobile Safari 7.0.0 (iOS 7.0.2)
  * Kindle 3.0.0
  * Android 2.3.7 (Android 2.3.7)

# Usage

## Loading

Load using your package manager, or use directly in web browser by adding `<script src="/path_to_http_invoke/httpinvoke-browser.js"></script>` to your HTML file.

## Examples

    httpinvoke('http://example.org', function(err, html) {
        if(err) {
            return console.log('Failure', err);
        }
        console.log('Success', html);
    });

    httpinvoke('http://updates.html5rocks.com', 'POST', {
        inputType: 'bytearray',
        outputType: 'text',
        input: [0, 1, 2, 253, 254, 255],
        headers: {
            'X-SomeHeader': 'ehlo'
        },
        uploading: function(current, total) {
            console.log('Uploaded ', current, ' bytes of ', total, ' total');
        },
        gotStatus: function(status, headers) {
            console.log('Got status', status, headers);
        },
        downloading: function(current, total) {
            console.log('Downloaded ', current, ' bytes of ', total, ' total');
        },
        finished: function(err, output) {
            if(err) {
                return console.log('Failure', err);
            }
            console.log('Success', output);
        }
    });

# API Reference

    var abort = httpinvoke(url, [method="GET", [options={}||cb]])

* **url** is a string for URL, e.g. `"http://example.org/"`.
* **method** is a string for HTTP method, one of `"HEAD"`, `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`.
* **options** is an object for various options (see the Options section below) or a function, which is used as a "finished" option (see the first example).
* **abort** is a function for aborting the HTTP request. It immediately calls the "finished" callback with an Error. If "finished" callback is already called before the "abort", nothing happens.

## Options

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
  0. **status** is a number for an HTTP response status code;
  0. **headers** is an object for HTTP response headers. Keys are lower-cased header names, values are strings.
* **finished** is a function that is called when HTTP response is fully downloaded, or any error happens. It is called with these arguments:
  0. **err** is null or an object that is an instance of Error;
  0. **output** is:
      * undefined, if err is not null or no response entity has been received (e.g. when **method** is `"HEAD"`),
      * a string, if **outputType** is `"text"` and response **headers** has `Content-Type` with `text/*`,
      * a bytearray - instance of [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays/Uint8Array) or instance of [Buffer](http://nodejs.org/api/buffer.html) or instance of [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) that has elements of type "number" with values ranging from `0` to `255` - if **outputType** is `"bytearray"` and response **headers** has `Content-Type` with `text/*`;
  0. **status** is:
      * undefined, if err is not null,
      * otherwise, a number for an HTTP response status code;
  0. **headers** is:
      * undefined, if err is not null,
      * otherwise, an object for HTTP response headers. Keys are lower-cased header names, values are strings.
* **outputType** is a string for the type of the **output** argument of the **finished** option, one of `"text"` (default), `"bytearray"` or a custom value that has corresponding **converters**.
* **inputType** is a string for the type of the **input** option, one of `"auto"`(default), `"bytearray"`, `"text"` or a custom value that has corresponding **converters**. If not `"auto"`, **input** must be not be undefined.
* **input** must be either one of:
  * undefined (default), if **inputType** is `"auto"` and request **headers** does not have `Content-Type`,
  * a string, if **inputType** is `"text"` or `"auto"`,
  * a bytearray - instance of [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays/ArrayBuffer) or instance of [ArrayBufferView](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays/ArrayBufferView) or instance of [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) or instance of [File](https://developer.mozilla.org/en-US/docs/Web/API/File) or instance of [Buffer](http://nodejs.org/api/buffer.html) or instance of [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) that has elements of type "number" with values ranging from `0` to `255` - if **inputType** is `"bytearray"` or `"auto"`;
* **headers** is an object for HTTP request headers. Keys are header names, values are strings. If **input** is not undefined, omitting the Content-Type requires **inputType** be not equal to `"auto"`.
* **converters** is an object to convert custom **inputType** and **outputType** values to `"bytearray"` or `"text"`. Example: `{"json text": JSON.stringify, "text json": JSON.parse}`. If you use custom **inputType**, then there must be at least one converter from that type to `"text"` or `"bytearray"`, and the other way around for **outputType**.
* **corsExposedHeaders** is an array of HTTP response headers to be extracted in **gotStatus** call. Default simple headers like "Content-Type" are always extracted. Applicable only for cross-origin requests.
* **corsCredentials** is a boolean for requesting to send credentials. Applicable only for a cross-origin request. See Feature Flags section. Defaults to `false`.
* **corsOriginHeader** is a string for the request header name for browsers with buggy CORS implementations (e.g. Android Browser 2.3.7) - which do not send the Origin request header in actual request, defaults to `"X-Httpinvoke-Origin"`, see `dummyserver.js` for an example of server-side part of the workaround implementation.

The callbacks are called in this strict sequence: **uploading** (two or more times), **gotStatus** (one time), **downloading** (two or more times), **finished** (one time), except the case that **finished** can be called with Error any time, and then no callbacks will be called.

## Feature Flags

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
* **corsPUT** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports `"PUT"` **method**
* **corsStatus** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports **status** argument in **gotStatus** option
* **corsResponseTextOnly** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports only **outputType** `"text"`
* **statuses** - array of supported HTTP status codes

# Development

To test for NodeJS functionality run `npm run test-node`.

To test for web browser functionality run `npm run test-browser`, copy the URL link that is displayed in console and open it in any web browser.

# License

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
