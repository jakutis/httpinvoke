# httpinvoke

HTTP client for JavaScript.

* Sends requests and receives responses.
* Lets you monitor upload and download progress, if supported by platform.
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

## Example

    httpinvoke('http://updates.html5rocks.com', 'POST', {
        input: JSON.stringify({foo:'bar'});
        headers: {
            'Content-Type': 'application/json'
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

# API reference

    var abort = httpinvoke(url, [method="GET", [options={}]])

* **url** is a string for URL, e.g. `"http://example.org/"`.
* **method** is a string for HTTP method, e.g. `"GET"`, `"POST"`, etc.
* **options** is an object for various options (see the Options section below).
* **abort** is a function for aborting the HTTP request. It immediately calls the "finished" callback with an Error. If "finished" callback is already called before the "abort", nothing happens.

## Options

See the Example section for all the options being used.
All options are optional.

* **headers** is an object for HTTP request headers. Keys are header names, values are strings.
* **input** is a string for HTTP request body.
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
  0. **output** is undefined, if err is not null, or a string for HTTP response body.

The callbacks are called in this strict sequence: **uploading** (two or more times), **gotStatus** (one time), **downloading** (two or more times), **finished** (one time), except the case that **finished** can be called with Error any time, and then no callbacks will be called.

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
