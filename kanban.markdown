# To do

    Goal:  setup Sauce Labs continuous integration
    To do: Sun Mar  8 21:40:44 EET 2015

    Goal:  update /test/index.html and /dummyserver.js so that data about feature flags and test failures in browsers are collected
    To do: Sun Mar  8 20:49:58 EET 2015

    Goal:  thoroughly test error codes
    To do: Sun Mar  8 20:41:26 EET 2015

    Goal:  thoroughly test isCrossDomain function (cors false, error #18)
    To do: Sun Mar  8 20:41:49 EET 2015

    Goal:  maybe add metadata properties to err (type="finished", output, status, headers, etc..), like in https://github.com/pathwar/node-pathwar/blob/master/lib/index.js
    To do: Wed Feb  4 13:31:33 EET 2015

    Goal:  create httpinvoke-xsrf hook
    To do: Wed Oct 15 17:18:05 EEST 2014

    Goal:  indicate awareness of window.fetch somewhere https://github.com/github/fetch
    To do: Wed Oct 15 00:40:50 EEST 2014

    Goal:  investigate why Kindle and Android-2.3.3 fails Content-Encoding=deflate tests
    To do: Mon Jun  2 18:07:09 UTC 2014

    Goal:  generator based API, http://strongloop.com/strongblog/node-js-callback-hell-promises-generators/
    To do: Tue Apr 29 10:45:31 UTC 2014

    Goal:  create high-level httpinvoke-partial, httpinvoke-backoff libraries
    To do: Tue Mar 18 09:58:48 UTC 2014

    Goal:  catch intentionally uncaught errors so that test would pass
    To do: Thu Mar  6 20:04:42 UTC 2014

    Goal:  "input" and "output" options using nodejs streams
    To do: Mon Feb 17 14:35:45 UTC 2014

    Goal:  try to use gulpjs
    To do: Mon Feb  3 07:16:26 UTC 2014

    Goal:  write a dummyserver related test that ensures that Content-Length is sent when uploading
    To do: Thu Dec 26 18:34:18 EET 2013

    Goal:  test downloading.current and downloading.total is correct when gzip
    To do: Sat Feb  1 11:12:53 UTC 2014

    Goal:  test specific list of output headers
    To do: Sat Feb  1 11:15:01 UTC 2014

    Goal:  check if input is allowed for specified method
    To do: Sat Feb  1 11:15:25 UTC 2014

    Goal:  investigate cases when "status" code is undefined and decide whether it is better to end the request with error - is it tru
    To do: Sat Feb  1 11:15:45 UTC 2014

    Goal:  use Socket "drain" event to throttle uploads
    To do: Sat Feb  1 11:16:01 UTC 2014

    Goal:  test typed arrays with byteoffset and bytelength (sliced arraybuffer)
    To do: Sat Feb  1 11:16:18 UTC 2014

    Goal:  run all tests with partialOutputMode set (the response Content-Type is being broken)
    To do: Sat Feb  1 11:17:12 UTC 2014

    Goal:  follow the Streams API implementation on browsers https://groups.google.com/a/chromium.org/forum/#!msg/blink-dev/cCPJTZbnjCw/9vFx8DHjjAEJ
    To do: Sat Feb  1 11:17:33 UTC 2014

    Goal:  test with compressed responses (especially nodejs)
    To do: Sat Feb  1 11:18:02 UTC 2014

    Goal:  test: status: HEAD POST PUT DELETE PATCH
    To do: Sat Feb  1 11:18:30 UTC 2014

    Goal:  PATCH PUT POST - verify input on server
    To do: Sat Feb  1 11:20:07 UTC 2014

    Goal:  all methods - verify headers on server
    To do: Sat Feb  1 11:20:41 UTC 2014

    Goal:  add a link in readme to a "features" micro webapp that collects and displays feature flags supported by different user agents, see design in KO 2013-10-01.pdf
    To do: Sat Feb  1 11:21:09 UTC 2014

    Goal:  jsbeautifier http://flippinawesome.org/2013/12/02/eliminating-code-smell-with-grunt/
    To do: Sat Feb  1 11:21:32 UTC 2014

    Goal:  get rid of HEAD timeout on safari
    To do: Sat Feb  1 11:21:55 UTC 2014

    Goal:  xml/html outputtype
    To do: Sat Feb  1 11:22:19 UTC 2014

    Goal:  oauth example
    To do: Sat Feb  1 11:22:36 UTC 2014

    Goal:  if ReadStream (NodeJS) is available, then provide it, so that anyone can pipe http on nodejs and probably browserify
    To do: Sat Feb  1 11:23:21 UTC 2014

    Goal:  json request/response example
    To do: Sat Feb  1 11:23:57 UTC 2014

# Doing

    Goal:  merge https://github.com/rse/thenable and mixInPromise
    To do: Wed Jun 18 07:50:20 UTC 2014
    Doing: Sun Mar  8 21:32:03 EET 2015

    Goal:  return a promise only when global.Promise is available
    To do: Sat Feb  1 11:24:33 UTC 2014
    Doing: Sun Mar  8 21:32:47 EET 2015

    Goal:  use global.Promise and fallback to mixInPromise
    To do: Sun Mar  8 21:33:26 EET 2015
    Doing: Sun Mar  8 21:33:29 EET 2015

    Goal:  remove built-in Promise implementation, require one provided by browser or polyfilled, https://github.com/getify/native-promise-only or https://github.com/rse/thenable
    To do: Sat May 17 12:12:29 UTC 2014
    Doing: Tue Jun 17 14:48:17 UTC 2014
    Log:   Tue Jun 17 14:48:20 UTC 2014 - Tue Jun 17 14:52:54 UTC 2014 - read the readmes of the two links

    Goal:  check correctness of asynchronicity in promise implementation, try to find official tests of Promises/A+
    To do: Tue Jun  3 13:35:39 UTC 2014
    Doing: Tue Jun 17 14:53:50 UTC 2014
    Log:   Tue Jun 17 14:54:10 UTC 2014 - Tue Jun 17 14:57:00 UTC 2014 - find the official tests https://github.com/promises-aplus/promises-tests

# Done

    Goal:  remove unused fixpositiveopt
    To do: Sat Feb  1 08:09:28 UTC 2014
    Doing: Fri Aug  1 09:29:16 UTC 2014
    Done:  Fri Aug  1 09:29:18 UTC 2014

    Goal:  err on 4xx or 5xx.txt
    To do: Tue Jul  1 19:34:29 UTC 2014
    Doing: Fri Aug  1 09:24:39 UTC 2014
    Done:  Fri Aug  1 09:24:42 UTC 2014
