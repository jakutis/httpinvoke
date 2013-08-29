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
  * Opera 9.50.0 (Windows XP) and later
  * Firefox 3.0.0 (Windows XP) and later
  * IE 7.0.0 (Windows XP) and later
  * Mobile Safari 6.0.0 (iOS 6.1.3)
  * Android 2.3.7 (Android 2.3.7)
  * Chrome 1.0.154 (Windows XP)
  * Safari 4.0.3 (Windows XP)
  * Safari 5.0.4 (Windows XP)
  * Safari 5.1.7 (Windows XP)

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
        inputType: 'json',
        outputType: 'text',
        input: {foo:'bar'},
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

* **uploading** is a function that is called when HTTP request upload progress event happens. It is called with these arguments:
  0. **current** is a number for the number of bytes currently sent.
  0. **total** is a number for the total number of bytes to be sent.
* **downloading** is a function that is called when HTTP response download progress event happens. It is called with these arguments:
  0. **current** is a number for the number of bytes currently received.
  0. **total** is a number for the total number of bytes to be received.
* **gotStatus** is a function that is called when HTTP response headers are received. It is called with these arguments:
  0. **status** is a number for an HTTP response status code.
  0. **headers** is an object for HTTP response headers. Keys are lower-cased header names, values are strings.
* **finished** is a function that is called when HTTP response is fully downloaded, or any error happens. It is called with these arguments:
  0. **err** is null or an object that is an instance of Error.
  0. **output** is:
      * undefined, if err is not null or no response entity has been received (e.g. when **method** is `"HEAD"`)
      * a string, if **outputType** is `"text"` or `"auto"` and response **headers** has `Content-Type` with `text/*`
      * an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays/ArrayBuffer), if **outputType** is `"arraybuffer"` or `"auto"` and response **headers** has `Content-Type` with neither `text/*`, nor `application/json`
      * any valid JSON value, if **outputType** is `"json"` or `"auto"` and response **headers** has Content-Type with `application/json`
* **outputType** is a string for the type of the **output** argument of the **finished** option, one of `"auto"` (default), `"bytearray"`, `"json"`, `"text"`.
* **inputType** is a string for the type of the **input** option, one of `"auto"`(default), `"bytearray"`, `"json"`, `"text"`. If `"auto"`, the request Content-Type must be specified. If not `"auto"`, **input** must be not be undefined.
* **input** must be either one of:
  * undefined (default), if **inputType** is `"auto"` and request **headers** does not have `Content-Type`
  * a string, if **inputType** is `"text"` or `"auto"` and request **headers** has `Content-Type` with `text/*`
  * an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays/ArrayBuffer), if **inputType** is `"arraybuffer"` or `"auto"` and request **headers** has `Content-Type` with neither `text/*`, nor `application/json`
  * any valid JSON value, if **outputType** is `"json"` or `"auto"` and response **headers** has `Content-Type` with `application/json`
* **headers** is an object for HTTP request headers. Keys are header names, values are strings. If **input** is not undefined, omitting the Content-Type requires **inputType** be not equal to `"auto"`.
* **corsHeaders** is an array of HTTP response headers to be extracted in **gotStatus** call. Default simple headers like "Content-Type" are always extracted. Applicable only for cross-origin requests.
* **corsCredentials** is a boolean for requesting to send credentials. Applicable only for a cross-origin request. See Feature Flags section.

The callbacks are called in this strict sequence: **uploading** (two or more times), **gotStatus** (one time), **downloading** (two or more times), **finished** (one time), except the case that **finished** can be called with Error any time, and then no callbacks will be called.

## Feature Flags

There are feature flags to be queried for platform-specific features.

    if(httpinvoke.cors) {
        console.log('Cross-Origin Resource Sharing support is available!');
    }

* **cors** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) is available
* **corsCredentials** - [cross-origin resource sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) supports sending cookies and HTTP authentication credentials

# Development

To test for NodeJS functionality run `make test-node`.

To test for web browser functionality run `make test-browser`, copy the URL link that is displayed in console and open it in any web browser.

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
