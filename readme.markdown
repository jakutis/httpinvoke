# httpinvoke

* A [JavaScript](http://www.ecma-international.org/publications/standards/Ecma-262.htm) library.
* An [HTTP](http://www.rfc-editor.org/rfc/rfc2616.txt) client.
* Sends requests and receive responses.
* Lets you monitor the upload and download progress, if supported by platform.
* Works on [web browser](http://en.wikipedia.org/wiki/Internet_Explorer_5) and [Node.js](http://nodejs.org) platforms.
* Detects the presence of [CommonJS](http://www.commonjs.org/) and [AMD](https://www.google.com/search?q=advanced+module+definition) script loaders.
* Available on [npm](https://npmjs.org/package/httpinvoke) and [GitHub](https://github.com/jakutis/httpinvoke).
* Supports [npm](https://npmjs.org/), [Bower](http://bower.io/) and [Component](http://component.io/) package managers.

[![browser support](http://ci.testling.com/jakutis/httpinvoke.png)](http://ci.testling.com/jakutis/httpinvoke)

# Usage

## Loading

Load using your package manager, or use directly in web browser by adding `<script src="/path_to_http_invoke/httpinvoke-browser.js"></script>` to your HTML file.

## Example

    httpinvoke('http://updates.html5rocks.com', {
        finished: function(err, result) {
            if(err) {
                return console.log('Failure', err);
            }
            console.log('Success', result);
        }
    });

# API reference

httpinvoke is just one function.
The arguments are: uri, method, options.

## uri argument

Can be any http or https URI.
Type is string.
Required.

## method argument

Any HTTP method.
Type is string.
Optional, defaults to a string 'GET'.

## options argument

A collection of various options.
Type is object.
Optional, defaults to an object with no properties.

### uploading option

TODO.
Type is function.
The arguments are: initial, current, final.
Optional, defaults to a no-op function.

#### initial argument

TODO.
Type is number.

#### current argument

TODO.
Type is number.

#### final argument

TODO.
Type is number.

### downloading option

TODO.
Exactly the same as uploading option.

### gotStatus option

TODO.
Type is function.
The arguments are: status, headers.
Optional, defaults to a no-op function.

#### status argument

HTTP response status code.
Type is number.

#### headers argument

HTTP response headers.
TODO

### finished option

TODO.
Type is function.
The arguments are: err, output.
Optional, defaults to a no-op function.

#### err argument

TODO.
Type is object.
Can either be null or instance of Error.

#### output argument

TODO.
Type is string.

### input option

TODO.
Type is string.
Optional, defaults to null.

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
