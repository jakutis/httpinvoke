var fs = require('fs');

var replace = function(contents, separator, replacements) {
    'use strict';
    replacements.forEach(function(replacement) {
        contents = contents.split(replacement.from);
        contents = contents[0] + separator + replacement.to + separator + contents[1];
    });
    return contents;
};

var processCommon = function(globalVar) {
    'use strict';
    return function(contents) {
        return replace(contents, ';', [{
            from: 'var addHook, initHooks, mixInPromise, pass, isArray, isArrayBufferView, _undefined, nextTick, isFormData, urlPartitioningRegExp, getOrigin;',
            to: globalVar + ';' + fs.readFileSync('./src/common/static.js').toString()
        }, {
            from: 'var hook, promise, failWithoutRequest, uploadProgressCb, downloadProgressCb, inputLength, inputHeaders, statusCb, outputHeaders, exposedHeaders, status, outputBinary, input, outputLength, outputConverter, partialOutputMode, origin, urlOrigin, useCORS, anonymous, system;',
            to: fs.readFileSync('./src/common/closures.js').toString()
        }]);
    };
};

var processBrowser = function() {
    'use strict';
    var pc = processCommon('global = window;');
    return function(contents) {
        return replace(fs.readFileSync('./src/umd.js').toString(), '', [{
            from: '__factory__',
            to: pc(contents)
        }]);
    };
};

module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                /* enforcing */
                'bitwise' : true,
                'camelcase' : true,
                'curly' : true,
                'eqeqeq' : true,
                'es3' : true,
                'forin' : true,
                'freeze' : true,
                'immed' : true,
                'indent' : 4,
                'latedef' : true,
                'newcap' : true,
                'noarg' : true,
                'noempty' : true,
                'nonew' : true,
                'plusplus' : true,
                'quotmark' : 'single',
                'undef' : true,
                'unused' : true,
                'strict' : true,
                'trailing' : true,
                'maxparams' : 0,
                'maxdepth' : 0,
                'maxstatements' : 0,
                'maxcomplexity' : 0,
                'maxlen' : 0,
                /* relaxing */
                'asi' : false,
                'boss' : false,
                'debug' : false,
                'eqnull' : false,
                'esnext' : false,
                'evil' : false,
                'expr' : false,
                'funcscope' : false,
                'globalstrict' : false,
                'iterator' : false,
                'lastsemic' : false,
                'laxbreak' : false,
                'laxcomma' : false,
                'loopfunc' : false,
                'moz' : false,
                'multistr' : false,
                'notypeof' : false,
                'proto' : false,
                'scripturl' : false,
                'smarttabs' : false,
                'shadow' : false,
                'sub' : false,
                'supernew' : false,
                'validthis' : false,
                /* environmnents */
                'browser' : false,
                'couch' : false,
                'devel' : false,
                'dojo' : false,
                'jquery' : false,
                'mootools' : false,
                'node' : false,
                'nonstandard' : false,
                'phantom' : false,
                'prototypejs' : false,
                'rhino' : false,
                'worker' : false,
                'wsh' : false,
                'yui' : false
            },
            test: {
                options: {
                    globals: {
                        it: true,
                        describe: true,
                        global: true,
                        require: true,
                        JSON: true
                    }
                },
                src: ['./test/*.js']
            },
            node: {
                options: {
                    node: true,
                    globals: {
                        JSON: true
                    }
                },
                src: ['./Gruntfile.js', './karma.conf.js', './dummyserver.js', './demo/index.js', './src/node.js', './src/commonjs.js']
            },
            hack: {
                options: {
                    browser: true,
                    node: true
                },
                src: ['./dummyserver-config.js']
            },
            browser: {
                options: {
                    browser: true,
                    plusplus: false,
                    globals: {
                        XDomainRequest: true,
                        ActiveXObject: true,
                        execScript: true,
                        httpinvoke0: true,
                        httpinvoke1: true
                    }
                },
                src: ['./src/browser.js']
            },
            common: {
                options: {
                    strict: false,
                    plusplus: false,
                    unused: false,
                    globals: {
                        global: true
                    }
                },
                src: ['./src/common/*.js']
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    bail: true
                },
                src: ['test/*.js', '!test/index.js']
            }
        },
        concat: {
            browser: {
                options: {
                    process: processBrowser()
                },
                src: ['./src/browser.js'],
                dest: './httpinvoke-browser.js'
            },
            node: {
                options: {
                    process: processCommon('')
                },
                src: ['./src/node.js'],
                dest: './httpinvoke-node.js'
            },
            commonjs: {
                options: {
                    process: function(contents) {
                        return replace(contents, ';', [{
                            from: 'var node;',
                            to: fs.readFileSync('./httpinvoke-node.js').toString()
                        }, {
                            from: 'var browser;',
                            to: fs.readFileSync('./httpinvoke-browser.js').toString()
                        }]);
                    }
                },
                src: ['./src/commonjs.js'],
                dest: './httpinvoke-commonjs.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask('compile', ['concat', 'jshint']);
    grunt.registerTask('test', ['compile', 'mochaTest']);
};
